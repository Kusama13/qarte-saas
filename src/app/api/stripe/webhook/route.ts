import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import logger from '@/lib/logger';
import { sendSubscriptionConfirmedEmail, sendPaymentFailedEmail, sendSubscriptionCanceledEmail } from '@/lib/email';
import type { SubscriptionStatus } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  logger.debug('Webhook event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const merchantId = session.metadata?.merchant_id;

      if (!merchantId) {
        logger.error('Webhook checkout.session.completed: missing merchant_id in metadata');
        break;
      }

      logger.debug('Activating subscription for merchant:', merchantId);

      // Mettre à jour le statut
      const { data: merchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', merchantId)
        .select('shop_name, user_id')
        .single();

      if (!merchant) {
        logger.error('Webhook checkout.session.completed: merchant not found for id:', merchantId);
        break;
      }

      // Envoyer l'email de confirmation (await pour serverless)
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          await sendSubscriptionConfirmedEmail(userData.user.email, merchant.shop_name).catch((err) => {
            logger.error('Failed to send subscription email', err);
          });
        }
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      // Ignore deletions of incomplete subscriptions (abandoned checkouts)
      if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
        logger.debug('Ignoring deletion of incomplete subscription:', subscription.id);
        break;
      }

      logger.debug('Canceling subscription:', subscription.id);

      const { data: merchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
        .select('shop_name, user_id')
        .single();

      if (!merchant) {
        logger.debug('Webhook subscription.deleted: no merchant matched stripe_subscription_id:', subscription.id);
        break;
      }

      // Envoyer l'email de confirmation de résiliation
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          const endDate = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          await sendSubscriptionCanceledEmail(userData.user.email, merchant.shop_name, endDate).catch((err) => {
            logger.error('Failed to send subscription canceled email', err);
          });
        }
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;

      logger.debug('Payment failed for customer:', invoice.customer);

      const { data: merchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', invoice.customer as string)
        .select('shop_name, user_id')
        .single();

      // Envoyer l'email de paiement échoué (await pour serverless)
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          await sendPaymentFailedEmail(userData.user.email, merchant.shop_name).catch((err) => {
            logger.error('Failed to send payment failed email', err);
          });
        }
      }

      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;

      logger.debug('Payment succeeded for customer:', invoice.customer);

      // Restore to active if was past_due
      await supabase
        .from('merchants')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', invoice.customer as string)
        .eq('subscription_status', 'past_due');

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;

      logger.debug('Subscription updated:', subscription.id, 'status:', subscription.status);

      // Ignore incomplete subscriptions (abandoned checkout sessions)
      if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
        logger.debug('Ignoring incomplete subscription:', subscription.id);
        break;
      }

      // Map Stripe status → notre SubscriptionStatus
      const statusMap: Record<string, SubscriptionStatus> = {
        trialing: 'trial',
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
        paused: 'canceled',
      };

      let newStatus: SubscriptionStatus = statusMap[subscription.status] || 'trial';

      // Cas special : annulation programmee en fin de periode
      if (subscription.status === 'active' && subscription.cancel_at_period_end) {
        newStatus = 'canceling';
      }

      const { data: updatedMerchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
        .select('id')
        .single();

      if (!updatedMerchant) {
        logger.debug('Webhook subscription.updated: no merchant matched stripe_subscription_id:', subscription.id);
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
