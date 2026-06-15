import Stripe from 'stripe';
import type { BillingInterval, PlanTier } from '@/types';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set — Stripe features will be unavailable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// ── Tier Tout-en-un (anciennement "Pro") ──
export const PLAN = {
  name: 'Tout-en-un',
  tier: 'all_in' as const,
  price: 24,
  priceId: (process.env.STRIPE_PRICE_ID || '').trim(),
  interval: 'month' as const,
};

// Plan 6 mois Tout-en-un — engagement ferme 6 mois, 1 mois offert (5×24 = 120€).
// Stripe : interval='month', interval_count=6 (configuré côté dashboard Stripe).
export const PLAN_SEMESTRIAL = {
  name: 'Tout-en-un 6 mois',
  tier: 'all_in' as const,
  price: 120,
  monthlyEquivalent: 20,
  priceId: (process.env.STRIPE_PRICE_ID_SEMESTRIAL || '').trim(),
  interval: 'month' as const,
  intervalCount: 6 as const,
};

// Plan annuel — legacy, plus proposé aux nouveaux merchants depuis mai 2026.
// Conservé pour reconnaitre les abonnés existants côté webhook.
export const PLAN_ANNUAL = {
  name: 'Tout-en-un Annuel',
  tier: 'all_in' as const,
  price: 240,
  monthlyEquivalent: 20,
  priceId: (process.env.STRIPE_PRICE_ID_ANNUAL || '').trim(),
  interval: 'year' as const,
};

// ── Tier Fidélité (réutilise les anciens Price IDs validés) ──
export const PLAN_FIDELITY = {
  name: 'Fidélité',
  tier: 'fidelity' as const,
  price: 14,
  priceId: (process.env.STRIPE_PRICE_FIDELITY || '').trim(),
  interval: 'month' as const,
};

// Plan 6 mois Fidélité — engagement ferme 6 mois, 1 mois offert (5×14 = 70€).
export const PLAN_FIDELITY_SEMESTRIAL = {
  name: 'Fidélité 6 mois',
  tier: 'fidelity' as const,
  price: 70,
  monthlyEquivalent: 12,
  priceId: (process.env.STRIPE_PRICE_FIDELITY_SEMESTRIAL || '').trim(),
  interval: 'month' as const,
  intervalCount: 6 as const,
};

// Fidélité annuel — legacy, plus proposé.
export const PLAN_FIDELITY_ANNUAL = {
  name: 'Fidélité Annuel',
  tier: 'fidelity' as const,
  price: 190,
  monthlyEquivalent: 16,
  priceId: (process.env.STRIPE_PRICE_FIDELITY_ANNUAL || '').trim(),
  interval: 'year' as const,
};

// Legacy Fidélité prices (19€ mensuel / 95€ 6 mois) — abonnés grandfathered avant le
// passage à 14€/70€. Reconnus par le webhook pour rester mappés 'fidelity'. Pas de nouveau checkout.
export const PLAN_FIDELITY_LEGACY_PRICE_IDS = {
  monthly: (process.env.STRIPE_PRICE_FIDELITY_LEGACY || '').trim(),
  semestrial: (process.env.STRIPE_PRICE_FIDELITY_SEMESTRIAL_LEGACY || '').trim(),
};

// Legacy Tout-en-un prices — kept so existing subscribers who still pay against
// these IDs are still mapped to 'all_in' by the webhook. Not used for new checkouts.
export const PLAN_LEGACY_PRICE_IDS = {
  monthly: (process.env.STRIPE_PRICE_ID_LEGACY || '').trim(),
  annual: (process.env.STRIPE_PRICE_ID_ANNUAL_LEGACY || '').trim(),
};

// USD plans for EN merchants
export const PLAN_EN = {
  name: 'Pro',
  price: 24,
  priceId: (process.env.STRIPE_PRICE_ID_EN || '').trim(),
  interval: 'month' as const,
};

export const PLAN_ANNUAL_EN = {
  name: 'Pro Annual',
  price: 240,
  monthlyEquivalent: 20,
  priceId: (process.env.STRIPE_PRICE_ID_ANNUAL_EN || '').trim(),
  interval: 'year' as const,
};

/**
 * Resolve le price ID Stripe pour un (tier × interval × locale).
 * EN merchants : pas de plan Fidélité ni de plan 6 mois → fallback sur l'annuel EN.
 */
export function getPriceId(tier: PlanTier, interval: BillingInterval, locale: 'fr' | 'en' = 'fr'): string {
  const isEN = locale === 'en';
  if (isEN) {
    return interval === 'monthly' ? PLAN_EN.priceId : PLAN_ANNUAL_EN.priceId;
  }
  if (tier === 'fidelity') {
    if (interval === 'annual') return PLAN_FIDELITY_ANNUAL.priceId;
    if (interval === 'semestrial') return PLAN_FIDELITY_SEMESTRIAL.priceId;
    return PLAN_FIDELITY.priceId;
  }
  if (interval === 'annual') return PLAN_ANNUAL.priceId;
  if (interval === 'semestrial') return PLAN_SEMESTRIAL.priceId;
  return PLAN.priceId;
}
