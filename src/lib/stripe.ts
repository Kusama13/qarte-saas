import Stripe from 'stripe';

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
  price: 19,
  priceId: (process.env.STRIPE_PRICE_FIDELITY || '').trim(),
  interval: 'month' as const,
};

export const PLAN_FIDELITY_ANNUAL = {
  name: 'Fidélité Annuel',
  tier: 'fidelity' as const,
  price: 180,
  monthlyEquivalent: 15,
  priceId: (process.env.STRIPE_PRICE_FIDELITY_ANNUAL || '').trim(),
  interval: 'year' as const,
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

