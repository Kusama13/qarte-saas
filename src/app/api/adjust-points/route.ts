import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

const adjustPointsSchema = z.object({
  customer_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  loyalty_card_id: z.string().uuid(),
  adjustment: z.number().int(),
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

    const { customer_id, merchant_id, loyalty_card_id, adjustment, reason } = parsed.data;

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
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
      .select('current_stamps')
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

    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update({
        current_stamps: newStamps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loyalty_card_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des points' },
        { status: 500 }
      );
    }

    const { error: auditError } = await supabase
      .from('point_adjustments')
      .insert({
        loyalty_card_id,
        merchant_id,
        customer_id,
        adjustment,
        reason: reason || null,
        adjusted_by: user.id,
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    // If points are reduced below tier 1 threshold, reset tier 1 redemptions in current cycle
    // This allows re-earning tier 1 reward after a manual point reset
    const { data: merchantData } = await supabase
      .from('merchants')
      .select('stamps_required, tier2_enabled')
      .eq('id', merchant_id)
      .single();

    if (merchantData && merchantData.tier2_enabled && newStamps < merchantData.stamps_required) {
      // Find the last tier 2 redemption date
      const { data: lastTier2 } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .eq('loyalty_card_id', loyalty_card_id)
        .eq('tier', 2)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .single();

      const lastTier2Date = lastTier2?.redeemed_at || '1970-01-01';

      // Delete tier 1 redemptions after the last tier 2 (current cycle)
      const { error: deleteError } = await supabase
        .from('redemptions')
        .delete()
        .eq('loyalty_card_id', loyalty_card_id)
        .eq('tier', 1)
        .gt('redeemed_at', lastTier2Date);

      if (deleteError) {
        console.error('Error resetting tier 1 redemptions:', deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      previous_stamps: currentStamps,
      new_stamps: newStamps,
      adjustment,
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
