import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { authorizeMerchant } from '@/lib/api-helpers';
import { completeReferralAfterReferredUse } from '@/lib/referral-completion';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const validateSchema = z.object({
  side: z.enum(['referred', 'referrer']),
  reason: z.string().trim().min(3).max(280),
});

// POST: Merchant valide manuellement un voucher de parrainage (filleul ou parrain)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: referralId } = await params;

    const body = await request.json();
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { side, reason } = parsed.data;

    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select(`
        id,
        merchant_id,
        status,
        referred_voucher_id,
        referrer_voucher_id,
        referred_customer:referred_customer_id(first_name)
      `)
      .eq('id', referralId)
      .maybeSingle();

    if (!referral) {
      return NextResponse.json({ error: 'Parrainage introuvable' }, { status: 404 });
    }

    const auth = await authorizeMerchant(referral.merchant_id);
    if (auth.response) return auth.response;

    // Pick voucher to validate
    const voucherId =
      side === 'referred' ? referral.referred_voucher_id : referral.referrer_voucher_id;

    if (!voucherId) {
      return NextResponse.json(
        {
          error: side === 'referrer'
            ? 'Le voucher parrain n\'existe pas encore — valide d\'abord le côté filleul.'
            : 'Voucher introuvable',
        },
        { status: 400 },
      );
    }

    // Atomic mark-used (prevents double-validation race)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        manual_validation_reason: reason,
        manually_validated_by: auth.merchantId,
      })
      .eq('id', voucherId)
      .eq('is_used', false)
      .select('id');

    if (updateError) {
      logger.error('Voucher manual update error:', updateError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // Si filleul → déclencher la création voucher parrain + push + SMS
    if (side === 'referred') {
      const filleulFirstName =
        (referral.referred_customer as { first_name?: string | null } | null)?.first_name || null;
      await completeReferralAfterReferredUse(supabaseAdmin, voucherId, filleulFirstName);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Referral manual validation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
