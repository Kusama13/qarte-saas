import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe, PLAN } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorise' },
        { status: 401 }
      );
    }

    if (!PLAN.priceId) {
      return NextResponse.json(
        { error: 'Configuration Stripe incomplete' },
        { status: 500 }
      );
    }

    // Get merchant info
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, shop_name, stripe_customer_id')
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
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'fr',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    );
  }
}
