import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import logger from '@/lib/logger';
import { PACK_TTC_CENTS, PROCESSING_FEE_TTC_CENTS, VAT_RATE, getBonusSms } from '@/lib/sms-pack-pricing';

const supabaseAdmin = getSupabaseAdmin();

const BodySchema = z.object({
  packSize: z.union([z.literal(50), z.literal(100), z.literal(150), z.literal(200), z.literal(250)]),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'packSize invalide' }, { status: 400 });
    }
    const { packSize } = parsed.data;

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, shop_name, stripe_customer_id, locale')
      .eq('user_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ error: 'Commerçant non trouvé' }, { status: 404 });

    // Ensure Stripe customer
    let customerId = merchant.stripe_customer_id as string | null;
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ('deleted' in existing && existing.deleted) customerId = null;
      } catch { customerId = null; }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: merchant.shop_name || undefined,
        metadata: { merchant_id: merchant.id, user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin.from('merchants').update({ stripe_customer_id: customerId }).eq('id', merchant.id);
    }

    const totalTtcCents = PACK_TTC_CENTS[packSize];
    const smsTtcCents = totalTtcCents - PROCESSING_FEE_TTC_CENTS;
    // Pour la compta : decomposition HT informative (TTC / 1.2). Stripe ne calcule plus la TVA.
    const totalHtCents = Math.round(totalTtcCents / (1 + VAT_RATE));
    const feeHtCents = Math.round(PROCESSING_FEE_TTC_CENTS / (1 + VAT_RATE));
    const smsHtCents = totalHtCents - feeHtCents;

    // Create pending purchase row first (so we can reconcile from webhook)
    const { data: purchase } = await supabaseAdmin
      .from('sms_pack_purchases')
      .insert({
        merchant_id: merchant.id,
        pack_size: packSize,
        amount_ht_cents: smsHtCents,
        processing_fee_ht_cents: feeHtCents,
        vat_rate: VAT_RATE,
        amount_ttc_cents: totalTtcCents,
        status: 'pending',
      })
      .select('id')
      .single();

    if (!purchase) return NextResponse.json({ error: 'Erreur à la création' }, { status: 500 });

    const isEN = merchant.locale === 'en';
    const bonusSms = getBonusSms(packSize);
    const bonusSuffix = bonusSms > 0
      ? (isEN ? ` + ${bonusSms} bonus` : ` + ${bonusSms} bonus`)
      : '';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: smsTtcCents,
            product_data: {
              name: isEN ? `SMS pack — ${packSize} SMS${bonusSuffix}` : `Pack SMS — ${packSize} SMS${bonusSuffix}`,
              description: isEN
                ? `Pack of ${packSize} SMS${bonusSms > 0 ? ` (+ ${bonusSms} bonus)` : ''}, valid as long as your subscription is active. VAT 20% included.`
                : `Pack de ${packSize} SMS${bonusSms > 0 ? ` (+ ${bonusSms} offerts)` : ''}, valable tout au long de ton abonnement. TVA 20% incluse.`,
              metadata: { type: 'sms_pack_sms', pack_size: String(packSize), bonus_sms: String(bonusSms) },
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: PROCESSING_FEE_TTC_CENTS,
            product_data: {
              name: isEN ? 'Processing fee' : 'Frais de traitement',
              description: isEN
                ? 'Covers credit provisioning, billing and human review of custom campaigns. VAT 20% included.'
                : 'Mise à disposition des crédits, facturation et modération humaine des campagnes personnalisées. TVA 20% incluse.',
              metadata: { type: 'sms_pack_fee' },
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/marketing?tab=sms&pack=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/marketing?tab=sms&pack=canceled`,
      metadata: {
        type: 'sms_pack',
        merchant_id: merchant.id,
        pack_size: String(packSize),
        purchase_id: purchase.id,
      },
      billing_address_collection: 'required',
      locale: isEN ? 'en' : 'fr',
      invoice_creation: { enabled: true },
    });

    // Record session id on the purchase row
    await supabaseAdmin
      .from('sms_pack_purchases')
      .update({ stripe_session_id: session.id })
      .eq('id', purchase.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('SMS pack checkout error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
