/**
 * POST /api/gift-cards/[id]/cancel
 *
 * Le merchant annule une commande de bon cadeau (paiement jamais reçu, doute,
 * remboursement géré hors-Qarte). Seules les `pending_payment` sont annulables
 * — une fois le bon active, on ne peut plus l'annuler (le destinataire l'a déjà
 * vu et reçu son SMS).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Lookup + ownership check (via JOIN merchants.user_id)
    const { data: giftCard } = await supabase
      .from('gift_cards')
      .select('id, merchant_id, status, merchants!inner(user_id)')
      .eq('id', id)
      .single();

    if (!giftCard) {
      return NextResponse.json({ error: 'Bon cadeau introuvable' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerUserId = (giftCard as any).merchants?.user_id;
    if (ownerUserId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (giftCard.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Seuls les bons en attente de paiement peuvent être annulés' },
        { status: 409 },
      );
    }

    // Atomic update — only if still pending
    const { data: updated, error } = await supabase
      .from('gift_cards')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'merchant',
      })
      .eq('id', id)
      .eq('status', 'pending_payment')
      .select('id');

    if (error) {
      logger.error('Gift card cancel error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Bon déjà traité' }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Gift card cancel error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
