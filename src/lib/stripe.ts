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
  price: 34,
  priceId: (process.env.STRIPE_PRICE_ID || '').trim(),
  interval: 'month' as const,
};

// Plan 6 mois Tout-en-un — engagement ferme 6 mois, 1 mois offert (5×34 = 170€).
// Stripe : interval='month', interval_count=6 (configuré côté dashboard Stripe).
export const PLAN_SEMESTRIAL = {
  name: 'Tout-en-un 6 mois',
  tier: 'all_in' as const,
  price: 170,
  monthlyEquivalent: 28,
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

// Parse une liste de price IDs legacy séparés par virgule. Chaque changement de prix
// AJOUTE l'ancien ID à la liste (sans écraser les générations précédentes) — d'où le
// support multi-valeurs plutôt qu'un slot unique par cycle.
const parseIds = (env: string | undefined): string[] =>
  (env || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Legacy price IDs — abonnés grandfathered qui paient encore un ancien tarif. Le webhook
// les mappe au bon tier (le cycle n'a pas d'importance : il est dérivé séparément de
// `subscription.items.data[0].price.recurring`). D'où une liste plate par tier, toutes
// générations et tous cycles confondus. Chaque changement de prix AJOUTE l'ancien ID à
// l'env correspondant (valeurs séparées par virgule) — pas de nouveau checkout dessus.
export const PLAN_FIDELITY_LEGACY_PRICE_IDS: string[] = [
  ...parseIds(process.env.STRIPE_PRICE_FIDELITY_LEGACY),
  ...parseIds(process.env.STRIPE_PRICE_FIDELITY_SEMESTRIAL_LEGACY),
];

export const PLAN_LEGACY_PRICE_IDS: string[] = [
  ...parseIds(process.env.STRIPE_PRICE_ID_LEGACY),
  ...parseIds(process.env.STRIPE_PRICE_ID_SEMESTRIAL_LEGACY),
  ...parseIds(process.env.STRIPE_PRICE_ID_ANNUAL_LEGACY),
];

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
