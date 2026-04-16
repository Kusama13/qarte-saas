import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import logger from '@/lib/logger';

type CardInfo = { brand: string; last4: string; exp_month: number; exp_year: number };
type SubscriptionInfo = { unit_amount: number; currency: string; interval: 'month' | 'year' };

function buildCard(card: { brand: string; last4: string; exp_month: number; exp_year: number }): CardInfo {
  return { brand: card.brand, last4: card.last4, exp_month: card.exp_month, exp_year: card.exp_year };
}

export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!merchant?.stripe_customer_id) {
      return NextResponse.json({ paymentMethod: null, subscription: null });
    }

    // Fetch in parallel: customer (for default PM) + recent subscriptions (for actual price + sub PM fallback).
    // Stripe lists subscriptions newest-first by created date — limit:3 covers merchants with prior churned subs.
    const [customer, subscriptions] = await Promise.all([
      stripe.customers.retrieve(merchant.stripe_customer_id, {
        expand: ['invoice_settings.default_payment_method'],
      }),
      stripe.subscriptions.list({
        customer: merchant.stripe_customer_id,
        status: 'all',
        limit: 3,
        expand: ['data.default_payment_method'],
      }),
    ]);

    if (customer.deleted) {
      return NextResponse.json({ paymentMethod: null, subscription: null });
    }

    // Extract subscription price from the most recent live subscription (skip canceled/expired)
    let subscription: SubscriptionInfo | null = null;
    const sub = subscriptions.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status));
    const subItem = sub?.items.data[0];
    const interval = subItem?.price.recurring?.interval;
    if (subItem?.price.unit_amount && (interval === 'month' || interval === 'year')) {
      subscription = {
        unit_amount: subItem.price.unit_amount,
        currency: subItem.price.currency,
        interval,
      };
    }

    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    let paymentMethod: CardInfo | null = null;

    if (defaultPaymentMethod && typeof defaultPaymentMethod !== 'string' && defaultPaymentMethod.card) {
      paymentMethod = buildCard(defaultPaymentMethod.card);
    } else if (sub?.default_payment_method && typeof sub.default_payment_method !== 'string' && sub.default_payment_method.card) {
      paymentMethod = buildCard(sub.default_payment_method.card);
    } else {
      // Fallback: any payment method on the customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: merchant.stripe_customer_id,
        type: 'card',
        limit: 1,
      });
      if (paymentMethods.data[0]?.card) {
        paymentMethod = buildCard(paymentMethods.data[0].card);
      }
    }

    return NextResponse.json({ paymentMethod, subscription });
  } catch (error) {
    logger.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du moyen de paiement' },
      { status: 500 }
    );
  }
}
