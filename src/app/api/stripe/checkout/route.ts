import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { stripe, PLAN, PLAN_ANNUAL, PLAN_EN, PLAN_ANNUAL_EN, PLAN_FIDELITY, PLAN_FIDELITY_ANNUAL } from '@/lib/stripe';
import type { PlanTier } from '@/types';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorise' },
        { status: 401 }
      );
    }

    // Parse plan preference from body
    let planChoice: 'monthly' | 'annual' = 'monthly';
    let tierChoice: PlanTier = 'all_in';
    try {
      const body = await request.json();
      if (body.plan === 'annual') planChoice = 'annual';
      if (body.tier === 'fidelity') tierChoice = 'fidelity';
    } catch {
      // No body or invalid JSON = default to monthly all_in
    }

    // Get merchant info
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, shop_name, stripe_customer_id, trial_ends_at, subscription_status, locale')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerçant non trouvé' },
        { status: 404 }
      );
    }

    // Resolve price ID based on tier + merchant locale (EUR for FR, USD for EN — Fidelity is FR/EUR only)
    const isEN = merchant.locale === 'en';
    let monthlyPlan, annualPlan;
    if (tierChoice === 'fidelity') {
      // Fidelity has no EN price set (FR/BE/CH only); fall back to all_in EN if EN merchant asks for it
      monthlyPlan = isEN ? PLAN_EN : PLAN_FIDELITY;
      annualPlan = isEN ? PLAN_ANNUAL_EN : PLAN_FIDELITY_ANNUAL;
    } else {
      monthlyPlan = isEN ? PLAN_EN : PLAN;
      annualPlan = isEN ? PLAN_ANNUAL_EN : PLAN_ANNUAL;
    }
    const selectedPriceId = planChoice === 'annual' && annualPlan.priceId
      ? annualPlan.priceId
      : monthlyPlan.priceId;

    if (!selectedPriceId) {
      return NextResponse.json(
        { error: 'Configuration Stripe incomplete - prix manquant pour ce plan' },
        { status: 500 }
      );
    }

    // Bloquer si déjà abonné (évite les doublons Stripe)
    if (merchant.subscription_status === 'active' || merchant.subscription_status === 'canceling') {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = merchant.stripe_customer_id;

    // Verify customer still exists on Stripe (may have been deleted manually)
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ('deleted' in existing && existing.deleted) {
          customerId = null;
        }
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: merchant.shop_name || undefined,
        metadata: {
          merchant_id: merchant.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save new customer ID and clear stale subscription ID
      await supabase
        .from('merchants')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: null,
        })
        .eq('id', merchant.id);
    } else if (merchant.shop_name) {
      // Backfill name on existing customers (no-op if already set to the same value)
      stripe.customers.update(customerId, { name: merchant.shop_name }).catch(err =>
        logger.error('Failed to update Stripe customer name:', err)
      );
    }

    // Create checkout session — charge immediately (no trial deferral)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true&plan=${planChoice}&tier=${tierChoice}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        merchant_id: merchant.id,
        plan: planChoice,
        tier: tierChoice,
      },
      subscription_data: {
        metadata: {
          merchant_id: merchant.id,
          tier: tierChoice,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: merchant.locale === 'en' ? 'en' : 'fr',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    );
  }
}
