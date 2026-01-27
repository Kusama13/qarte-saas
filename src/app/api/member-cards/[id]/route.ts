import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const extendSchema = z.object({
  duration_months: z.number().int().min(1).max(12),
});

// GET: Récupérer une carte membre par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        customer:customers (*),
        merchant:merchants (*)
      `)
      .eq('id', id)
      .single();

    if (error || !memberCard) {
      return NextResponse.json(
        { error: 'Carte membre non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ memberCard });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH: Prolonger une carte membre
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = extendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { duration_months } = parsed.data;

    // Récupérer la carte actuelle
    const { data: currentCard, error: fetchError } = await supabaseAdmin
      .from('member_cards')
      .select('valid_until')
      .eq('id', id)
      .single();

    if (fetchError || !currentCard) {
      return NextResponse.json(
        { error: 'Carte membre non trouvée' },
        { status: 404 }
      );
    }

    // Calculer la nouvelle date de fin
    // Si la carte est expirée, partir de maintenant; sinon, partir de valid_until
    const baseDate = new Date(currentCard.valid_until) > new Date()
      ? new Date(currentCard.valid_until)
      : new Date();

    const newValidUntil = new Date(baseDate);
    newValidUntil.setMonth(newValidUntil.getMonth() + duration_months);

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .update({ valid_until: newValidUntil.toISOString() })
      .eq('id', id)
      .select(`
        *,
        customer:customers (*)
      `)
      .single();

    if (error) {
      console.error('Error extending member card:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memberCard });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: Supprimer une carte membre
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('member_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting member card:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
