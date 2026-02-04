import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { stripe, PLAN } from '@/lib/stripe';

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

    if (!PLAN.priceId) {
      return NextResponse.json(
        { error: 'Configuration Stripe incomplete - STRIPE_PRICE_ID manquant' },
        { status: 500 }
      );
    }

    // Get merchant info
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, shop_name, stripe_customer_id, trial_ends_at')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commercant non trouve' },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = merchant.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          merchant_id: merchant.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to merchant
      await supabase
        .from('merchants')
        .update({ stripe_customer_id: customerId })
        .eq('id', merchant.id);
    }

    // Calculate trial end from merchant's trial period
    let trialEnd: number | undefined;
    if (merchant.trial_ends_at) {
      const trialEndsAt = new Date(merchant.trial_ends_at);
      const now = new Date();

      // Only set trial_end if trial hasn't expired yet
      if (trialEndsAt > now) {
        // Stripe requires Unix timestamp in seconds
        trialEnd = Math.floor(trialEndsAt.getTime() / 1000);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLAN.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        merchant_id: merchant.id,
      },
      subscription_data: {
        metadata: {
          merchant_id: merchant.id,
        },
        // Billing starts at end of trial period (no immediate charge)
        ...(trialEnd && { trial_end: trialEnd }),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'fr',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session', details: message },
      { status: 500 }
    );
  }
}
