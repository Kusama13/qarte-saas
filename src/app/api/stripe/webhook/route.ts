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
        .select('shop_name, user_id, trial_ends_at')
        .single();

      if (!merchant) {
        logger.error('Webhook checkout.session.completed: merchant not found for id:', merchantId);
        break;
      }

      // Envoyer l'email de confirmation (await pour serverless)
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          // Date du prochain prélèvement = fin de l'essai si encore actif
          let nextBillingDate: string | undefined;
          if (merchant.trial_ends_at) {
            const trialEnd = new Date(merchant.trial_ends_at);
            if (trialEnd > new Date()) {
              nextBillingDate = trialEnd.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
            }
          }
          await sendSubscriptionConfirmedEmail(userData.user.email, merchant.shop_name, nextBillingDate).catch((err) => {
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
      }

      // Email déjà envoyé au moment du passage en 'canceling' (subscription.updated)
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
      const { data: merchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', invoice.customer as string)
        .eq('subscription_status', 'past_due')
        .select('shop_name, user_id')
        .single();

      // Email de confirmation si paiement récupéré (past_due → active)
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          await sendSubscriptionConfirmedEmail(userData.user.email, merchant.shop_name).catch((err) => {
            logger.error('Failed to send payment recovery email', err);
          });
        }
      }

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
      // Couvre active ET trialing (annulation pendant le trial)
      if ((subscription.status === 'active' || subscription.status === 'trialing') && subscription.cancel_at_period_end) {
        newStatus = 'canceling';
      }

      // Cas inverse : merchant annule la resiliation via le portail
      // trialing + cancel_at_period_end=false → garder 'active' (pas 'trial')
      if (subscription.status === 'trialing' && !subscription.cancel_at_period_end) {
        // Verifier si le merchant a deja un abonnement actif (checkout complete)
        const { data: existingMerchant } = await supabase
          .from('merchants')
          .select('subscription_status')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (existingMerchant && (existingMerchant.subscription_status === 'active' || existingMerchant.subscription_status === 'canceling')) {
          newStatus = 'active';
        }
      }

      const { data: updatedMerchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
        .select('id, shop_name, user_id')
        .single();

      if (!updatedMerchant) {
        logger.debug('Webhook subscription.updated: no merchant matched stripe_subscription_id:', subscription.id);
      }

      // Email de confirmation d'annulation programmée
      if (updatedMerchant && newStatus === 'canceling') {
        const { data: userData } = await supabase.auth.admin.getUserById(updatedMerchant.user_id);
        if (userData?.user?.email) {
          const endDate = new Date((subscription.cancel_at as number) * 1000).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          await sendSubscriptionCanceledEmail(userData.user.email, updatedMerchant.shop_name, endDate).catch((err) => {
            logger.error('Failed to send subscription canceling email', err);
          });
        }
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
