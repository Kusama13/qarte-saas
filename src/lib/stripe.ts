import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set — Stripe features will be unavailable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

export const PLAN = {
  name: 'Pro',
  price: 24,
  priceId: process.env.STRIPE_PRICE_ID || '',
  interval: 'month' as const,
  features: [
    'Clients illimites',
    'Cartes de fidelite digitales',
    'QR codes personnalises',
    'Statistiques en temps reel',
    'Support prioritaire par email',
    'Mises a jour gratuites',
  ],
};

export const PLAN_ANNUAL = {
  name: 'Pro Annuel',
  price: 240,
  monthlyEquivalent: 20,
  priceId: process.env.STRIPE_PRICE_ID_ANNUAL || '',
  interval: 'year' as const,
};

// USD plans for EN merchants
export const PLAN_EN = {
  name: 'Pro',
  price: 24,
  priceId: process.env.STRIPE_PRICE_ID_EN || '',
  interval: 'month' as const,
};

export const PLAN_ANNUAL_EN = {
  name: 'Pro Annual',
  price: 240,
  monthlyEquivalent: 20,
  priceId: process.env.STRIPE_PRICE_ID_ANNUAL_EN || '',
  interval: 'year' as const,
};

