import { NextResponse } from 'next/server';
import { stripe, PLAN, PLAN_ANNUAL, PLAN_FIDELITY, PLAN_FIDELITY_ANNUAL, PLAN_LEGACY_PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import logger from '@/lib/logger';
import { sendSubscriptionConfirmedEmail, sendPaymentFailedEmail, sendSubscriptionCanceledEmail, sendSubscriptionReactivatedEmail, sendSmsPackPurchaseEmail } from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { sendCapiPurchaseEvent } from '@/lib/facebook-capi';
import { toBCP47, getCurrencyForCountry } from '@/lib/utils';
import type { SubscriptionStatus, PlanTier } from '@/types';

/** Map a Stripe price ID to our internal tier. Returns null if unknown
 *  (e.g. very old grandfathered prices, EN-only prices, custom-negotiated rates). */
function tierFromPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  if (priceId === PLAN_FIDELITY.priceId || priceId === PLAN_FIDELITY_ANNUAL.priceId) return 'fidelity';
  if (priceId === PLAN.priceId || priceId === PLAN_ANNUAL.priceId) return 'all_in';
  // Legacy Tout-en-un prices — existing subscribers stay on these
  if (priceId === PLAN_LEGACY_PRICE_IDS.monthly || priceId === PLAN_LEGACY_PRICE_IDS.annual) return 'all_in';
  return null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Extract email locale from merchant row, default 'fr' */
function mLocale(merchant: { locale?: string }): EmailLocale {
  return (merchant.locale as EmailLocale) || 'fr';
}

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

      // SMS pack purchase — separate flow, not a subscription
      if (session.metadata?.type === 'sms_pack') {
        const purchaseId = session.metadata?.purchase_id;
        const packSize = parseInt(session.metadata?.pack_size || '0', 10);
        if (!purchaseId || !packSize) {
          logger.error('SMS pack webhook missing purchase_id or pack_size', { sessionId: session.id });
          break;
        }

        // Idempotency: only credit if purchase is still pending
        const { data: purchase } = await supabase
          .from('sms_pack_purchases')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_invoice_id: session.invoice as string | null,
          })
          .eq('id', purchaseId)
          .eq('status', 'pending')
          .select('id, merchant_id, pack_size')
          .single();

        if (!purchase) {
          logger.debug('SMS pack already paid or not found:', purchaseId);
          break;
        }

        // Atomic credit via RPC (évite la race avec un sendSms concurrent).
        const { error: creditError } = await supabase.rpc('credit_sms_pack', {
          p_merchant_id: purchase.merchant_id,
          p_amount: purchase.pack_size,
        });
        if (creditError) {
          logger.error('credit_sms_pack RPC failed', { purchaseId, error: creditError });
          // Pas d'envoi d'email si le crédit a échoué — éviter de promettre des SMS qui ne sont pas crédités.
          break;
        }

        logger.debug('SMS pack credited', { merchantId: purchase.merchant_id, packSize: purchase.pack_size });

        // Email de confirmation au merchant (fire-and-forget, ne bloque jamais le webhook).
        const { data: merchantInfo } = await supabase
          .from('merchants')
          .select('shop_name, user_id, locale, sms_pack_balance')
          .eq('id', purchase.merchant_id)
          .maybeSingle();
        if (merchantInfo?.user_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(merchantInfo.user_id as string);
          const email = userData?.user?.email;
          if (email) {
            // Récupère l'URL de la facture Stripe si dispo (utile pour la compta du merchant).
            let invoiceUrl: string | null = null;
            if (session.invoice) {
              try {
                const inv = await stripe.invoices.retrieve(session.invoice as string);
                invoiceUrl = inv.hosted_invoice_url || null;
              } catch (err) {
                logger.error('Failed to retrieve invoice URL', { invoice: session.invoice, err });
              }
            }
            const amountTtc = session.amount_total ? (session.amount_total / 100).toFixed(2) : '—';
            await sendSmsPackPurchaseEmail(email, {
              shopName: (merchantInfo.shop_name as string) || 'Qarte',
              packSize: purchase.pack_size,
              amountTtc,
              newBalance: Number(merchantInfo.sms_pack_balance || 0),
              invoiceUrl,
              locale: ((merchantInfo.locale as EmailLocale) || 'fr'),
            }).catch((err) => {
              logger.error('Failed to send SMS pack purchase email', err);
            });
          }
        }
        break;
      }

      logger.debug('Activating subscription for merchant:', merchantId);

      // Idempotent: only update if not already active (H11)
      const tierFromSession = session.metadata?.tier === 'fidelity' ? 'fidelity' : 'all_in';
      const { data: merchant } = await supabase
        .from('merchants')
        .update({
          subscription_status: 'active',
          plan_tier: tierFromSession,
          billing_interval: session.metadata?.plan === 'annual' ? 'annual' : 'monthly',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          billing_period_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', merchantId)
        .neq('subscription_status', 'active')
        .select('shop_name, user_id, trial_ends_at, locale, country, plan_tier')
        .single();

      if (!merchant) {
        // Either merchant not found or already active — skip email
        logger.debug('Webhook checkout.session.completed: merchant not found or already active for id:', merchantId);
        break;
      }

      // Envoyer l'email de confirmation (await pour serverless)
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      if (userData?.user?.email) {
        const locale = mLocale(merchant);
        // Debit immediat — prochain prelevement dans 30j (mensuel) ou 1 an (annuel)
        const billingInterval = session.metadata?.plan === 'annual' ? 'annual' : 'monthly';
        const nextBillingDate: string | undefined = undefined; // Email uses generic fallback ("dans 30 jours" / "dans 1 an")
        await sendSubscriptionConfirmedEmail(userData.user.email, merchant.shop_name, nextBillingDate, billingInterval, locale, (merchant.plan_tier as 'fidelity' | 'all_in') || 'all_in').catch((err) => {
          logger.error('Failed to send subscription email', err);
        });

        // Facebook CAPI — Purchase event (dedup with client-side Pixel via event_id)
        const isAnnual = session.metadata?.plan === 'annual';
        const eventId = `sub_${merchantId}_${Date.now()}`;
        const currency = getCurrencyForCountry(merchant.country);
        const paidAmount = session.amount_total ? session.amount_total / 100 : (isAnnual ? 240 : 24);
        await sendCapiPurchaseEvent({
          email: userData.user.email,
          value: paidAmount,
          currency,
          contentName: isAnnual ? 'Qarte Pro Annuel' : 'Qarte Pro',
          eventId,
        }).catch((err) => {
          logger.error('Failed to send CAPI purchase event', err);
        });
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
          stripe_subscription_id: null,
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
        .select('shop_name, user_id, locale')
        .single();

      // Envoyer l'email de paiement échoué (await pour serverless)
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          await sendPaymentFailedEmail(userData.user.email, merchant.shop_name, mLocale(merchant)).catch((err) => {
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
        .select('shop_name, user_id, locale, plan_tier')
        .single();

      // Email de confirmation si paiement récupéré (past_due → active)
      if (merchant) {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        if (userData?.user?.email) {
          await sendSubscriptionConfirmedEmail(userData.user.email, merchant.shop_name, undefined, undefined, mLocale(merchant), (merchant.plan_tier as 'fidelity' | 'all_in') || 'all_in').catch((err) => {
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
      let wasReactivated = false;
      if (subscription.status === 'trialing' && !subscription.cancel_at_period_end) {
        // Verifier si le merchant a deja un abonnement actif (checkout complete)
        const { data: existingMerchant } = await supabase
          .from('merchants')
          .select('subscription_status')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (existingMerchant && (existingMerchant.subscription_status === 'active' || existingMerchant.subscription_status === 'canceling')) {
          if (existingMerchant.subscription_status === 'canceling') wasReactivated = true;
          newStatus = 'active';
        }
      }

      // active + cancel_at_period_end=false → verifier si etait canceling
      if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        const { data: existingMerchant } = await supabase
          .from('merchants')
          .select('subscription_status')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (existingMerchant?.subscription_status === 'canceling') {
          wasReactivated = true;
        }
      }

      // Sync tier if Stripe portal swapped the price (e.g. via portal config).
      // Unknown prices (grandfathered, custom) leave plan_tier untouched.
      const currentPriceId = subscription.items.data[0]?.price?.id;
      const detectedTier = tierFromPriceId(currentPriceId);
      const updatePayload: Record<string, unknown> = {
        subscription_status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (detectedTier) updatePayload.plan_tier = detectedTier;

      const { data: updatedMerchant } = await supabase
        .from('merchants')
        .update(updatePayload)
        .eq('stripe_subscription_id', subscription.id)
        .select('id, shop_name, user_id, locale')
        .single();

      if (!updatedMerchant) {
        logger.debug('Webhook subscription.updated: no merchant matched stripe_subscription_id:', subscription.id);
      }

      // Email de confirmation d'annulation programmée
      if (updatedMerchant && newStatus === 'canceling') {
        const { data: userData } = await supabase.auth.admin.getUserById(updatedMerchant.user_id);
        if (userData?.user?.email) {
          const locale = mLocale(updatedMerchant);
          // cancel_at can be null — email template has a fallback message
          const endDate = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toLocaleDateString(toBCP47(locale), {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined;
          await sendSubscriptionCanceledEmail(userData.user.email, updatedMerchant.shop_name, endDate, locale).catch((err) => {
            logger.error('Failed to send subscription canceling email', err);
          });
        }
      }

      // Email de confirmation de réactivation (canceling → active)
      if (updatedMerchant && wasReactivated && newStatus === 'active') {
        const { data: userData } = await supabase.auth.admin.getUserById(updatedMerchant.user_id);
        if (userData?.user?.email) {
          await sendSubscriptionReactivatedEmail(userData.user.email, updatedMerchant.shop_name, mLocale(updatedMerchant)).catch((err) => {
            logger.error('Failed to send subscription reactivated email', err);
          });
        }
      }

      break;
    }

    case 'checkout.session.expired': {
      // Cleanup : la session Stripe a expiré (24h sans paiement). Marque le purchase
      // pending correspondant comme failed pour ne pas polluer la table indéfiniment.
      // N'affecte que les sms_pack — les abandons d'abonnement ne créent pas de row pending.
      const session = event.data.object;
      if (session.metadata?.type !== 'sms_pack') break;
      const purchaseId = session.metadata?.purchase_id;
      if (!purchaseId) break;

      const { data: updated } = await supabase
        .from('sms_pack_purchases')
        .update({ status: 'failed' })
        .eq('id', purchaseId)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();

      if (updated) {
        logger.debug('SMS pack purchase marked failed (session expired)', { purchaseId });
      }
      break;
    }

    case 'charge.refunded': {
      // Stripe envoie ce hook quand un refund (total ou partiel) est créé sur un charge.
      // On ne traite que les remboursements totaux des packs SMS — les refunds partiels
      // d'abonnement sont hors scope.
      const charge = event.data.object;
      // `invoice` n'est pas exposé par défaut dans le type Charge récent de la SDK Stripe ;
      // il l'est dans la réponse API quand un charge est lié à une facture (c'est notre cas
      // pour les packs SMS — `invoice_creation: { enabled: true }` dans la session checkout).
      const invoiceId = (charge as unknown as { invoice?: string | null }).invoice;
      if (!invoiceId) break;
      // Ignorer si le charge n'est pas totalement remboursé (refund partiel = cas non couvert).
      if (charge.amount_refunded < charge.amount) break;

      const { data: purchase } = await supabase
        .from('sms_pack_purchases')
        .update({ status: 'refunded' })
        .eq('stripe_invoice_id', invoiceId)
        .eq('status', 'paid')
        .select('id, merchant_id, pack_size')
        .maybeSingle();

      if (!purchase) {
        // Pas un pack SMS, ou déjà remboursé, ou jamais payé — ignore silencieusement.
        break;
      }

      // Décrément atomique via le même RPC (amount négatif). Le solde peut tomber sous 0
      // si le merchant a déjà consommé les SMS — `consumePackOne` gère bien le balance > 0,
      // donc un négatif = bloqué jusqu'au prochain pack. On log pour visibilité admin.
      const { data: newBalance, error: refundError } = await supabase.rpc('credit_sms_pack', {
        p_merchant_id: purchase.merchant_id,
        p_amount: -purchase.pack_size,
      });
      if (refundError) {
        logger.error('credit_sms_pack RPC (refund) failed', { purchaseId: purchase.id, error: refundError });
        break;
      }
      if (typeof newBalance === 'number' && newBalance < 0) {
        logger.error('SMS pack refund left balance negative — partial consumption before refund', {
          merchantId: purchase.merchant_id,
          packSize: purchase.pack_size,
          newBalance,
        });
      }

      logger.debug('SMS pack refunded', { merchantId: purchase.merchant_id, packSize: purchase.pack_size });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
