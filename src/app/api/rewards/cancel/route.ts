import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const cancelSchema = z.object({
  loyalty_card_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = cancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { loyalty_card_id } = parsed.data;
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const supabase = getSupabaseAdmin();

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get loyalty card with merchant info
    const { data: loyaltyCard } = await supabase
      .from('loyalty_cards')
      .select('*, merchant:merchants(id, user_id, tier2_enabled, stamps_required, tier2_stamps_required, loyalty_mode)')
      .eq('id', loyalty_card_id)
      .maybeSingle();

    if (!loyaltyCard) {
      return NextResponse.json(
        { error: 'Carte de fidélité introuvable' },
        { status: 404 }
      );
    }

    const merchant = loyaltyCard.merchant;

    if (merchant.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Find the last redemption for this card
    const { data: lastRedemption } = await supabase
      .from('redemptions')
      .select('id, tier, stamps_used, amount_accumulated, redeemed_at')
      .eq('loyalty_card_id', loyalty_card_id)
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastRedemption) {
      return NextResponse.json(
        { error: 'Aucune récompense à annuler' },
        { status: 400 }
      );
    }

    // Determine if stamps need to be restored
    // Tier 1 with tier2_enabled: stamps were NOT reset, so no restore needed
    // Tier 2 or tier 1 without tier2: stamps WERE reset to 0, restore them
    const shouldRestoreStamps = lastRedemption.tier === 2 || !merchant.tier2_enabled;

    // Cagnotte mode: current_amount is ALWAYS reset to 0 on any redeem, so always restore it
    const shouldRestoreAmount = merchant.loyalty_mode === 'cagnotte' && lastRedemption.amount_accumulated;

    if (shouldRestoreStamps || shouldRestoreAmount) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (shouldRestoreStamps) {
        updateData.current_stamps = lastRedemption.stamps_used;
      }

      if (shouldRestoreAmount) {
        updateData.current_amount = lastRedemption.amount_accumulated;
      }

      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update(updateData)
        .eq('id', loyalty_card_id);

      if (updateError) {
        logger.error('Restore stamps error:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors de la restauration des points' },
          { status: 500 }
        );
      }
    }

    // Delete the redemption record
    const { error: deleteError } = await supabase
      .from('redemptions')
      .delete()
      .eq('id', lastRedemption.id);

    if (deleteError) {
      logger.error('Delete redemption error:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la récompense' },
        { status: 500 }
      );
    }

    // Audit log
    await supabase
      .from('point_adjustments')
      .insert({
        loyalty_card_id,
        merchant_id: merchant.id,
        customer_id: loyaltyCard.customer_id,
        adjustment: 0,
        reason: `Annulation récompense palier ${lastRedemption.tier}${shouldRestoreAmount ? ` · ${Number(lastRedemption.amount_accumulated).toFixed(2).replace('.', ',')} € restitué` : ''}`,
        adjusted_by: user.id,
      });

    return NextResponse.json({
      success: true,
      message: `Récompense palier ${lastRedemption.tier} annulée`,
      tier: lastRedemption.tier,
      stamps_restored: shouldRestoreStamps ? lastRedemption.stamps_used : null,
      amount_restored: (shouldRestoreStamps && merchant.loyalty_mode === 'cagnotte')
        ? lastRedemption.amount_accumulated
        : null,
    });
  } catch (error) {
    logger.error('Cancel reward error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
