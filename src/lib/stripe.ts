import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const PLAN = {
  name: 'Pro',
  price: 19,
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
  price: 190,
  monthlyEquivalent: 15.83,
  priceId: process.env.STRIPE_PRICE_ID_ANNUAL || '',
  interval: 'year' as const,
};

