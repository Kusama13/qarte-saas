import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const adjustPointsSchema = z.object({
  customer_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  loyalty_card_id: z.string().uuid(),
  adjustment: z.number().int(),
  amount_adjustment: z.number().optional(),
  reason: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = adjustPointsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { customer_id, merchant_id, loyalty_card_id, adjustment, amount_adjustment, reason } = parsed.data;

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, stamps_required, tier2_enabled, tier2_stamps_required')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier ce client' },
        { status: 403 }
      );
    }

    const { data: loyaltyCard, error: cardError } = await supabase
      .from('loyalty_cards')
      .select('current_stamps, current_amount')
      .eq('id', loyalty_card_id)
      .eq('customer_id', customer_id)
      .eq('merchant_id', merchant_id)
      .single();

    if (cardError || !loyaltyCard) {
      return NextResponse.json(
        { error: 'Carte de fidélité introuvable' },
        { status: 404 }
      );
    }

    const currentStamps = loyaltyCard.current_stamps;
    let newStamps = currentStamps + adjustment;

    if (newStamps < 0) {
      newStamps = 0;
    }

    // Cap: ajustement manuel ne doit jamais atteindre le seuil de recompense
    const effectiveMax = (merchant.tier2_enabled && merchant.tier2_stamps_required)
      ? merchant.tier2_stamps_required - 1
      : (merchant.stamps_required ? merchant.stamps_required - 1 : Infinity);
    if (adjustment > 0 && newStamps > effectiveMax) {
      newStamps = effectiveMax;
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      current_stamps: newStamps,
      updated_at: new Date().toISOString(),
    };

    // Handle amount adjustment for cagnotte mode
    const currentAmount = Number(loyaltyCard.current_amount ?? 0);
    let newAmount = currentAmount;
    if (amount_adjustment !== undefined) {
      newAmount = Math.max(0, currentAmount + amount_adjustment);
      updatePayload.current_amount = newAmount;
    }

    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update(updatePayload)
      .eq('id', loyalty_card_id);

    if (updateError) {
      logger.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des points' },
        { status: 500 }
      );
    }

    // Auto-build reason if not provided
    let finalReason = reason || null;
    if (!reason && amount_adjustment !== undefined && amount_adjustment !== 0) {
      const parts: string[] = [];
      if (adjustment !== 0) parts.push(`${adjustment > 0 ? '+' : ''}${adjustment} passage${Math.abs(adjustment) > 1 ? 's' : ''}`);
      parts.push(`${amount_adjustment > 0 ? '+' : ''}${amount_adjustment.toFixed(2).replace('.', ',')} € cumul`);
      finalReason = parts.join(' · ');
    }

    const { error: auditError } = await supabase
      .from('point_adjustments')
      .insert({
        loyalty_card_id,
        merchant_id,
        customer_id,
        adjustment,
        reason: finalReason,
        adjusted_by: user.id,
      });

    if (auditError) {
      logger.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      previous_stamps: currentStamps,
      new_stamps: newStamps,
      adjustment,
      ...(amount_adjustment !== undefined && {
        previous_amount: currentAmount,
        new_amount: newAmount,
        amount_adjustment,
      }),
    });
  } catch (error) {
    logger.error('Adjust points error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
