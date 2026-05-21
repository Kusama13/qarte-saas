/**
 * Cron de réconciliation Stripe — ferme le trou des force-cancel non remontés.
 *
 * Contexte : si pour une raison X (webhook raté, downtime, event delivery
 * failed côté Stripe) le `customer.subscription.deleted` n'arrive jamais sur
 * notre endpoint, un merchant reste bloqué en `past_due` côté DB alors que
 * Stripe a déjà force-cancel son abo. Il continue à recevoir des relances
 * jusqu'au step 4, puis plus rien — il pollue les stats churn.
 *
 * Stratégie : 1×/jour, on liste les past_due dont `past_due_since > 14j`,
 * on interroge Stripe (`subscriptions.retrieve`). Si l'abo est `canceled`
 * (ou 404), on passe le merchant en `canceled` côté DB + on envoie
 * `SubscriptionForceCanceledEmail` (template dédié, ton informatif sur la
 * suppression auto + 30j de conservation des données).
 *
 * Idempotent : un merchant déjà `canceled` n'est jamais re-sélectionné.
 * Fenêtre 14j choisie pour rester sous Stripe Smart Retries (~21j par
 * défaut) avec marge : tout past_due > 14j a forcément vu plusieurs
 * retries, soit Stripe l'a force-cancel, soit il est en cours de
 * dernier retry — dans tous les cas on aligne le statut DB.
 */

export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { batchGetUserEmails, verifyCronAuth } from '@/lib/cron-helpers';
import { stripe } from '@/lib/stripe';
import { sendSubscriptionForceCanceledEmail } from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Seuil de sélection : on n'interroge Stripe que pour les past_due "vieux".
// Sous ce seuil, Smart Retries est probablement encore en cours — on laisse
// le webhook faire son travail normal.
const STALE_PAST_DUE_DAYS = 14;

// Statuts Stripe considérés comme "subscription effacée → force-cancel côté Qarte"
const CANCELED_STRIPE_STATUSES: ReadonlySet<Stripe.Subscription.Status> =
  new Set<Stripe.Subscription.Status>(['canceled', 'incomplete_expired']);

type StaleMerchant = {
  id: string;
  shop_name: string;
  user_id: string;
  locale: string | null;
  stripe_subscription_id: string | null;
  past_due_since: string;
};

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_PAST_DUE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, stripe_subscription_id, past_due_since')
    .eq('subscription_status', 'past_due')
    .is('deleted_at', null)
    .not('past_due_since', 'is', null)
    .lt('past_due_since', cutoff)
    .returns<StaleMerchant[]>();

  if (error) {
    logger.error('stripe-reconcile fetch failed', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const list = candidates ?? [];
  const results = { scanned: list.length, reconciled: 0, stillActive: 0, skipped: 0, errors: 0 };
  const reconciledIds: string[] = [];

  // Pre-fetch emails pour tout le batch (helper standard, 10-at-a-time GoTrue).
  // Volume attendu petit, mais on s'aligne sur la convention des autres crons.
  const emailMap = list.length > 0
    ? await batchGetUserEmails(supabase, [...new Set(list.map(m => m.user_id))])
    : new Map<string, string>();

  for (const merchant of list) {
    // Pas de stripe_subscription_id → on ne peut pas vérifier auprès de Stripe,
    // mais l'absence depuis > 14j en past_due est déjà un signal fort. On
    // force-cancel quand même pour ne pas laisser pourrir.
    if (!merchant.stripe_subscription_id) {
      const ok = await markCanceled(merchant, 'no_stripe_id', emailMap);
      if (ok) { reconciledIds.push(merchant.id); results.reconciled++; }
      else { results.errors++; }
      continue;
    }

    let stripeStatus: Stripe.Subscription.Status | null = null;
    try {
      const sub = await stripe.subscriptions.retrieve(merchant.stripe_subscription_id);
      stripeStatus = sub.status;
    } catch (err) {
      // Stripe a effacé l'abo → force-cancel.
      const isMissing = err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing';
      if (isMissing) {
        const ok = await markCanceled(merchant, 'stripe_404', emailMap);
        if (ok) { reconciledIds.push(merchant.id); results.reconciled++; }
        else { results.errors++; }
        continue;
      }
      logger.error('stripe-reconcile retrieve failed', { id: merchant.id, sub: merchant.stripe_subscription_id, err });
      results.errors++;
      continue;
    }

    if (CANCELED_STRIPE_STATUSES.has(stripeStatus)) {
      const ok = await markCanceled(merchant, `stripe_${stripeStatus}`, emailMap);
      if (ok) { reconciledIds.push(merchant.id); results.reconciled++; }
      else { results.errors++; }
    } else {
      // Stripe le considère encore vivant (probablement en cours de dernier
      // retry). On laisse le webhook faire son travail.
      results.stillActive++;
    }
  }

  logger.info('stripe-reconcile done', { results, reconciledIds });
  return NextResponse.json({ ok: true, ...results, reconciledIds });
}

/**
 * Atomic update past_due → canceled + email. Renvoie `true` si on a effectivement
 * basculé la ligne (l'email n'est envoyé que dans ce cas). Si le webhook live
 * nous a doublés entre le SELECT et l'UPDATE, `.select('id')` ne retournera rien
 * → on n'envoie pas de doublon de `SubscriptionForceCanceledEmail`.
 */
async function markCanceled(
  merchant: StaleMerchant,
  reason: string,
  emailMap: Map<string, string>,
): Promise<boolean> {
  const { data: updated, error } = await supabase
    .from('merchants')
    .update({
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      past_due_since: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchant.id)
    .eq('subscription_status', 'past_due') // race-guard contre webhook live
    .select('id');

  if (error) {
    logger.error('stripe-reconcile update failed', { id: merchant.id, err: error });
    return false;
  }
  if (!updated || updated.length === 0) {
    // Webhook nous a doublés → ligne déjà canceled, pas d'email à envoyer.
    logger.info('stripe-reconcile noop (already canceled)', { id: merchant.id });
    return false;
  }

  // Email (échec d'envoi ≠ rollback statut : la canceled est correcte, c'est juste
  // l'email qui rate ; on log et on passe).
  const email = emailMap.get(merchant.user_id);
  if (email) {
    const locale: EmailLocale = merchant.locale === 'en' ? 'en' : 'fr';
    await sendSubscriptionForceCanceledEmail(email, merchant.shop_name, locale).catch((err) => {
      logger.error('stripe-reconcile email failed', { id: merchant.id, err });
    });
  }

  logger.info('stripe-reconcile marked canceled', { id: merchant.id, reason });
  return true;
}
