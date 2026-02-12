import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const supabaseAdmin = getSupabaseAdmin();

const useVoucherSchema = z.object({
  voucher_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  phone_number: z.string().min(1),
});

// POST: Client consomme un voucher (self-service)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = useVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { voucher_id, customer_id, phone_number } = parsed.data;

    // SECURITY: Verify phone_number matches the customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 });
    }

    // 1. Récupérer le voucher
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('id', voucher_id)
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 });
    }

    if (voucher.is_used) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // Check expiration
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Récompense expirée' }, { status: 410 });
    }

    // 2. Atomic: mark as used only if still unused (prevents double-use race condition)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', voucher_id)
      .eq('is_used', false)
      .select('id');

    if (updateError) {
      console.error('Voucher update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // 3. Vérifier si c'est un voucher filleul → auto-créer le voucher parrain
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referred_voucher_id', voucher_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (referral) {
      // Récupérer le merchant pour la description de la récompense parrain
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('referral_reward_referrer')
        .eq('id', referral.merchant_id)
        .single();

      if (merchant?.referral_reward_referrer) {
        // Créer le voucher parrain
        const { data: referrerVoucher } = await supabaseAdmin
          .from('vouchers')
          .insert({
            loyalty_card_id: referral.referrer_card_id,
            merchant_id: referral.merchant_id,
            customer_id: referral.referrer_customer_id,
            reward_description: merchant.referral_reward_referrer,
          })
          .select()
          .single();

        // Mettre à jour le referral → completed
        if (referrerVoucher) {
          await supabaseAdmin
            .from('referrals')
            .update({
              referrer_voucher_id: referrerVoucher.id,
              status: 'completed',
            })
            .eq('id', referral.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Récompense utilisée avec succès',
    });
  } catch (error) {
    console.error('Voucher use error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
