import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

export async function POST() {
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
      return NextResponse.json(
        { error: 'Aucun compte Stripe associé' },
        { status: 400 }
      );
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: merchant.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du portail' },
      { status: 500 }
    );
  }
}
