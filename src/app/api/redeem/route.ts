import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone } from '@/lib/utils';
import { z } from 'zod';

const redeemSchema = z.object({
  loyalty_card_id: z.string().uuid(),
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

    const { loyalty_card_id } = parsed.data;
    const supabase = createServerClient();

    // Get the loyalty card with merchant info - the card already has customer_id
    const { data: loyaltyCard } = await supabase
      .from('loyalty_cards')
      .select('*, merchant:merchants(*)')
      .eq('id', loyalty_card_id)
      .single();

    if (!loyaltyCard) {
      return NextResponse.json(
        { error: 'Carte de fidélité introuvable ou non autorisée' },
        { status: 404 }
      );
    }

    if (loyaltyCard.current_stamps < loyaltyCard.merchant.stamps_required) {
      return NextResponse.json(
        {
          error: 'Pas assez de passages pour utiliser la récompense',
          current_stamps: loyaltyCard.current_stamps,
          required_stamps: loyaltyCard.merchant.stamps_required,
        },
        { status: 400 }
      );
    }

    const { error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: loyaltyCard.merchant_id,
        customer_id: loyaltyCard.customer_id,
        stamps_used: loyaltyCard.current_stamps,
      });

    if (redemptionError) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la récompense' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update({ current_stamps: 0 })
      .eq('id', loyaltyCard.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la carte' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Récompense utilisée avec succès',
      reward_description: loyaltyCard.merchant.reward_description,
    });
  } catch (error) {
    console.error('Redeem error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
