import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabaseAdmin = getSupabaseAdmin();

// Helper to verify user owns the program's merchant
async function verifyProgramOwnership(programId: string): Promise<{ authorized: boolean }> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false };
  }

  // Get program with merchant info
  const { data: program } = await supabaseAdmin
    .from('member_programs')
    .select('merchant_id, merchants!inner(user_id)')
    .eq('id', programId)
    .single();

  if (!program || (program.merchants as any)?.user_id !== user.id) {
    return { authorized: false };
  }

  return { authorized: true };
}

// Helper to verify user owns the card's program
async function verifyCardOwnership(cardId: string): Promise<{ authorized: boolean; programId?: string }> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false };
  }

  // Get card with program and merchant info
  const { data: card } = await supabaseAdmin
    .from('member_cards')
    .select('program_id, program:member_programs!inner(merchant_id, merchants!inner(user_id))')
    .eq('id', cardId)
    .single();

  if (!card) {
    return { authorized: false };
  }

  const merchants = (card.program as any)?.merchants;
  if (!merchants || merchants.user_id !== user.id) {
    return { authorized: false };
  }

  return { authorized: true, programId: card.program_id };
}

const extendSchema = z.object({
  // Allow any positive duration: days (0.033+), weeks (0.25+), months (1+)
  duration_months: z.number().min(0.01).max(999),
});

// GET: Récupérer une carte membre par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this card's program
    const authCheck = await verifyCardOwnership(id);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        customer:customers (*),
        program:member_programs (*)
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

    // SECURITY: Verify user owns this card's program
    const authCheck = await verifyCardOwnership(id);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

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
    const baseDate = new Date(currentCard.valid_until) > new Date()
      ? new Date(currentCard.valid_until)
      : new Date();

    const newValidUntil = new Date(baseDate);

    // Convert duration_months to days and add to date
    if (duration_months >= 999) {
      // "Unlimited" = 100 years
      newValidUntil.setFullYear(newValidUntil.getFullYear() + 100);
    } else {
      // Convert to days: duration_months * 30 days
      const days = Math.round(duration_months * 30);
      newValidUntil.setDate(newValidUntil.getDate() + days);
    }

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .update({ valid_until: newValidUntil.toISOString() })
      .eq('id', id)
      .select(`
        *,
        customer:customers (*),
        program:member_programs (*)
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

// DELETE: Retirer un client d'un programme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // SECURITY: Verify user owns this card's program
    const authCheck = await verifyCardOwnership(id);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

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
