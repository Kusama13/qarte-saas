import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const supabaseAdmin = getSupabaseAdmin();

const useVoucherSchema = z.object({
  voucher_id: z.string().uuid(),
  customer_id: z.string().uuid(),
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

    const { voucher_id, customer_id } = parsed.data;

    // 1. Récupérer le voucher
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('id', voucher_id)
      .eq('customer_id', customer_id)
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 });
    }

    if (voucher.is_used) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // 2. Marquer le voucher comme utilisé
    const { error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', voucher_id);

    if (updateError) {
      console.error('Voucher update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
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
