import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const merchantId = session.metadata?.merchant_id;
  const plan = session.metadata?.plan;

  if (!merchantId) {
    console.error('No merchant_id in session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'active',
      stripe_subscription_id: subscriptionId,
      subscription_plan: plan || 'monthly',
      subscription_ends_at: currentPeriodEnd.toISOString(),
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchantId);

  console.log(`Subscription activated for merchant ${merchantId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const merchantId = subscription.metadata?.merchant_id;

  if (!merchantId) {
    // Try to find merchant by stripe_subscription_id
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!merchant) {
      console.error('No merchant found for subscription:', subscription.id);
      return;
    }

    await updateMerchantSubscription(merchant.id, subscription);
  } else {
    await updateMerchantSubscription(merchantId, subscription);
  }
}

async function updateMerchantSubscription(
  merchantId: string,
  subscription: Stripe.Subscription
) {
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: status,
      subscription_ends_at: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchantId);

  console.log(`Subscription updated for merchant ${merchantId}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!merchant) {
    console.error('No merchant found for deleted subscription:', subscription.id);
    return;
  }

  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchant.id);

  console.log(`Subscription canceled for merchant ${merchant.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (!merchant) return;

  // Log successful payment (optional: create payment history table)
  console.log(`Payment succeeded for merchant ${merchant.id}: ${invoice.amount_paid / 100}EUR`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (!merchant) return;

  await supabaseAdmin
    .from('merchants')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchant.id);

  console.log(`Payment failed for merchant ${merchant.id}`);
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trial';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'inactive';
    default:
      return 'inactive';
  }
}
