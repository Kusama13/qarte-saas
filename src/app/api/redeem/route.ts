import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

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

    // Get the loyalty card with merchant info - the card already has customer_id
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
    const stampsRequired = tier === 2 ? merchant.tier2_stamps_required : merchant.stamps_required;
    const rewardDescription = tier === 2 ? merchant.tier2_reward_description : merchant.reward_description;

    // Check if tier 2 is enabled when trying to redeem tier 2
    if (tier === 2 && !merchant.tier2_enabled) {
      return NextResponse.json(
        { error: 'Le palier 2 n\'est pas activé pour ce commerce' },
        { status: 400 }
      );
    }

    // Check if user has enough stamps for the requested tier
    if (loyaltyCard.current_stamps < stampsRequired) {
      return NextResponse.json(
        {
          error: `Pas assez de passages pour le palier ${tier}`,
          current_stamps: loyaltyCard.current_stamps,
          required_stamps: stampsRequired,
        },
        { status: 400 }
      );
    }

    // For tier 1 with tier 2 enabled, check if already redeemed in current cycle
    // A "cycle" is determined by checking if there's a tier 1 redemption after the last tier 2 redemption (or ever if no tier 2)
    if (tier === 1 && merchant.tier2_enabled) {
      // Get the last tier 2 redemption date (which resets the cycle)
      const { data: lastTier2Redemption } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('loyalty_card_id', loyalty_card_id)
        .eq('tier', 2)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check if tier 1 was already redeemed in current cycle
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
          { error: 'Vous avez déjà réclamé la récompense du palier 1. Continuez vers le palier 2 !' },
          { status: 400 }
        );
      }
    }

    // Only reset stamps to 0 for tier 2 (or tier 1 if tier 2 is not enabled)
    const shouldResetStamps = tier === 2 || !merchant.tier2_enabled;

    if (shouldResetStamps) {
      // Atomic stamp update FIRST to prevent orphaned redemptions on race condition
      const { data: updated, error: updateError } = await supabase
        .from('loyalty_cards')
        .update({ current_stamps: 0 })
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
    }

    // Record the redemption (after stamp update to avoid orphans)
    const { error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: loyaltyCard.merchant_id,
        customer_id: loyaltyCard.customer_id,
        stamps_used: loyaltyCard.current_stamps,
        tier: tier,
      });

    if (redemptionError) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la récompense' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Récompense palier ${tier} utilisée avec succès`,
      reward_description: rewardDescription,
      tier: tier,
      stamps_reset: shouldResetStamps,
    });
  } catch (error) {
    console.error('Redeem error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
