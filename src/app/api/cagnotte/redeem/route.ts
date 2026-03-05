import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const redeemSchema = z.object({
  loyalty_card_id: z.string().uuid(),
  tier: z.number().min(1).max(2).optional().default(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = redeemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { loyalty_card_id, tier } = parsed.data;
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const supabase = getSupabaseAdmin();

    // SECURITY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé - connexion requise' },
        { status: 401 }
      );
    }

    // Get the loyalty card with merchant info
    const { data: loyaltyCard } = await supabase
      .from('loyalty_cards')
      .select('*, merchant:merchants(*)')
      .eq('id', loyalty_card_id)
      .maybeSingle();

    if (!loyaltyCard) {
      return NextResponse.json(
        { error: 'Carte de fidélité introuvable ou non autorisée' },
        { status: 404 }
      );
    }

    const merchant = loyaltyCard.merchant;

    // SECURITY: Verify user owns this merchant
    if (merchant.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé - vous ne pouvez pas gérer les récompenses de ce commerce' },
        { status: 403 }
      );
    }

    // Verify cagnotte mode
    if (merchant.loyalty_mode !== 'cagnotte') {
      return NextResponse.json(
        { error: 'Ce commerce n\'utilise pas le mode cagnotte' },
        { status: 400 }
      );
    }

    const stampsRequired = tier === 2 ? merchant.tier2_stamps_required : merchant.stamps_required;

    // Check if tier 2 is enabled when trying to redeem tier 2
    if (tier === 2 && !merchant.tier2_enabled) {
      return NextResponse.json(
        { error: 'Le palier 2 n\'est pas activé pour ce commerce' },
        { status: 400 }
      );
    }

    // Check if user has enough stamps
    if (loyaltyCard.current_stamps < stampsRequired) {
      return NextResponse.json(
        { error: `Pas assez de passages pour le palier ${tier}`, current_stamps: loyaltyCard.current_stamps, required_stamps: stampsRequired },
        { status: 400 }
      );
    }

    // For tier 1 with tier 2 enabled, check if already redeemed in current cycle
    if (tier === 1 && merchant.tier2_enabled) {
      const { data: lastTier2Redemption } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('loyalty_card_id', loyalty_card_id)
        .eq('tier', 2)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let tier1Query = supabase
        .from('redemptions')
        .select('id')
        .eq('loyalty_card_id', loyalty_card_id)
        .eq('tier', 1);

      if (lastTier2Redemption) {
        tier1Query = tier1Query.gt('redeemed_at', lastTier2Redemption.redeemed_at);
      }

      const { data: existingTier1 } = await tier1Query.limit(1).maybeSingle();

      if (existingTier1) {
        return NextResponse.json(
          { error: 'Vous avez déjà réclamé la cagnotte du palier 1. Continuez vers le palier 2 !' },
          { status: 400 }
        );
      }
    }

    // Calculate reward value
    const currentAmount = Number(loyaltyCard.current_amount);
    const rawPercent = tier === 2 ? merchant.cagnotte_tier2_percent : merchant.cagnotte_percent;
    if (rawPercent == null || Number(rawPercent) <= 0) {
      return NextResponse.json(
        { error: `Le pourcentage cagnotte du palier ${tier} n'est pas configuré` },
        { status: 400 }
      );
    }
    const percent = Number(rawPercent);
    const rewardValue = Math.round(currentAmount * percent) / 100;

    // Cagnotte: ALWAYS reset current_amount to 0 on any redemption
    // Stamps: reset to 0 only for tier 2 (or tier 1 if tier 2 is not enabled) — same as stamps mode
    const shouldResetStamps = tier === 2 || !merchant.tier2_enabled;

    const updateData: Record<string, number> = { current_amount: 0 };
    if (shouldResetStamps) {
      updateData.current_stamps = 0;
    }

    // Atomic update with race protection
    const { data: updated, error: updateError } = await supabase
      .from('loyalty_cards')
      .update(updateData)
      .eq('id', loyaltyCard.id)
      .gte('current_stamps', stampsRequired)
      .select('id');

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la carte' },
        { status: 500 }
      );
    }
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Récompense déjà récupérée' },
        { status: 409 }
      );
    }

    // Record the redemption with cagnotte audit trail
    const { error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: loyaltyCard.merchant_id,
        customer_id: loyaltyCard.customer_id,
        stamps_used: loyaltyCard.current_stamps,
        tier: tier,
        amount_accumulated: currentAmount,
        reward_percent: percent,
        reward_value: rewardValue,
      });

    if (redemptionError) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la récompense' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cagnotte palier ${tier} utilisée avec succès`,
      reward_value: rewardValue,
      reward_percent: percent,
      amount_accumulated: currentAmount,
      tier: tier,
      stamps_reset: shouldResetStamps,
    });
  } catch (error) {
    logger.error('Cagnotte redeem error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
