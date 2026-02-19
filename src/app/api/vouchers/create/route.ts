import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const createVoucherSchema = z.object({
  loyalty_card_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { loyalty_card_id } = parsed.data;
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const supabase = getSupabaseAdmin();

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorise' },
        { status: 401 }
      );
    }

    // Get loyalty card with merchant info
    const { data: loyaltyCard } = await supabase
      .from('loyalty_cards')
      .select('id, customer_id, merchant_id, merchant:merchants(id, user_id, birthday_gift_enabled, birthday_gift_description)')
      .eq('id', loyalty_card_id)
      .maybeSingle();

    if (!loyaltyCard) {
      return NextResponse.json(
        { error: 'Carte de fidelite introuvable' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merchant = loyaltyCard.merchant as any;

    if (merchant?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorise' },
        { status: 403 }
      );
    }

    if (!merchant.birthday_gift_enabled || !merchant.birthday_gift_description) {
      return NextResponse.json(
        { error: 'Le cadeau anniversaire n\'est pas configure. Activez-le dans Marketing > Automations.' },
        { status: 400 }
      );
    }

    // Check if customer already has an active birthday voucher
    const { data: existingVoucher } = await supabase
      .from('vouchers')
      .select('id')
      .eq('loyalty_card_id', loyalty_card_id)
      .eq('source', 'birthday')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existingVoucher) {
      return NextResponse.json(
        { error: 'Ce client a deja un cadeau anniversaire actif' },
        { status: 409 }
      );
    }

    // Create the voucher (14 day expiration, same as automated)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { data: voucher, error: insertError } = await supabase
      .from('vouchers')
      .insert({
        loyalty_card_id,
        merchant_id: merchant.id,
        customer_id: loyaltyCard.customer_id,
        reward_description: merchant.birthday_gift_description,
        source: 'birthday',
        tier: 1,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, reward_description, expires_at')
      .single();

    if (insertError) {
      logger.error('Create voucher error:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la creation du cadeau' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      voucher,
    });
  } catch (error) {
    logger.error('Create voucher error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
