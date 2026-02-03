import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

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
      return NextResponse.json({ paymentMethod: null });
    }

    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(merchant.stripe_customer_id, {
      expand: ['invoice_settings.default_payment_method'],
    });

    if (customer.deleted) {
      return NextResponse.json({ paymentMethod: null });
    }

    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

    if (!defaultPaymentMethod || typeof defaultPaymentMethod === 'string') {
      // Try to get from subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: merchant.stripe_customer_id,
        status: 'active',
        limit: 1,
        expand: ['data.default_payment_method'],
      });

      if (subscriptions.data.length > 0) {
        const subPaymentMethod = subscriptions.data[0].default_payment_method;
        if (subPaymentMethod && typeof subPaymentMethod !== 'string') {
          const card = subPaymentMethod.card;
          if (card) {
            return NextResponse.json({
              paymentMethod: {
                brand: card.brand,
                last4: card.last4,
                exp_month: card.exp_month,
                exp_year: card.exp_year,
              },
            });
          }
        }
      }

      return NextResponse.json({ paymentMethod: null });
    }

    const card = defaultPaymentMethod.card;
    if (!card) {
      return NextResponse.json({ paymentMethod: null });
    }

    return NextResponse.json({
      paymentMethod: {
        brand: card.brand,
        last4: card.last4,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
      },
    });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du moyen de paiement' },
      { status: 500 }
    );
  }
}
