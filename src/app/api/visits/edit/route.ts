import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const editVisitSchema = z.object({
  visit_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  loyalty_card_id: z.string().uuid(),
  new_points: z.number().int().min(0),
  new_amount: z.number().min(0).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = editVisitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { visit_id, merchant_id, loyalty_card_id, new_points, new_amount } = parsed.data;

    // Verify merchant ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, loyalty_mode')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Get current visit
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('id, points_earned, amount_spent, loyalty_card_id')
      .eq('id', visit_id)
      .eq('merchant_id', merchant_id)
      .eq('loyalty_card_id', loyalty_card_id)
      .single();

    if (visitError || !visit) {
      return NextResponse.json({ error: 'Visite introuvable' }, { status: 404 });
    }

    const oldPoints = visit.points_earned || 0;
    const pointsDiff = new_points - oldPoints;

    const oldAmount = Number(visit.amount_spent || 0);
    const amountDiff = (new_amount !== undefined) ? new_amount - oldAmount : 0;

    // Update visit
    const visitUpdate: Record<string, unknown> = { points_earned: new_points };
    if (new_amount !== undefined) {
      visitUpdate.amount_spent = new_amount;
    }

    const { error: updateVisitError } = await supabase
      .from('visits')
      .update(visitUpdate)
      .eq('id', visit_id);

    if (updateVisitError) {
      logger.error('Update visit error:', updateVisitError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // Adjust loyalty card stamps and amount
    if (pointsDiff !== 0 || amountDiff !== 0) {
      const { data: card } = await supabase
        .from('loyalty_cards')
        .select('current_stamps, current_amount, customer_id')
        .eq('id', loyalty_card_id)
        .single();

      if (card) {
        const cardUpdate: Record<string, unknown> = {};

        if (pointsDiff !== 0) {
          cardUpdate.current_stamps = Math.max(0, (card.current_stamps || 0) + pointsDiff);
        }
        if (amountDiff !== 0) {
          cardUpdate.current_amount = Math.max(0, Number(card.current_amount || 0) + amountDiff);
        }

        const { error: cardUpdateError } = await supabase
          .from('loyalty_cards')
          .update(cardUpdate)
          .eq('id', loyalty_card_id);

        if (cardUpdateError) {
          logger.error('Update card error:', cardUpdateError);
        }

        // Audit log: record visit edit in point_adjustments
        const reasonParts: string[] = [];
        if (pointsDiff !== 0) reasonParts.push(`${pointsDiff > 0 ? '+' : ''}${pointsDiff} passage${Math.abs(pointsDiff) > 1 ? 's' : ''}`);
        if (amountDiff !== 0) reasonParts.push(`${amountDiff > 0 ? '+' : ''}${amountDiff.toFixed(2).replace('.', ',')} €`);
        const auditReason = `Modification visite : ${reasonParts.join(' · ')}`;

        const { error: auditError } = await supabase
          .from('point_adjustments')
          .insert({
            loyalty_card_id,
            merchant_id,
            customer_id: card.customer_id,
            adjustment: pointsDiff,
            reason: auditReason,
            adjusted_by: user.id,
          });

        if (auditError) {
          logger.error('Visit edit audit log error:', auditError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      points_diff: pointsDiff,
      amount_diff: amountDiff,
    });
  } catch (error) {
    logger.error('Edit visit error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
