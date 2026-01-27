import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const supabaseAdmin = getSupabaseAdmin();

const assignMemberSchema = z.object({
  program_id: z.string().uuid(),
  customer_id: z.string().uuid(),
});

// GET: Liste des membres d'un programme
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');

    if (!programId) {
      return NextResponse.json(
        { error: 'program_id requis' },
        { status: 400 }
      );
    }

    const { data: memberCards, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        customer:customers (*)
      `)
      .eq('program_id', programId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching member cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memberCards });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Assigner un client à un programme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assignMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { program_id, customer_id } = parsed.data;

    // Récupérer le programme pour avoir la durée et le merchant_id
    const { data: program, error: programError } = await supabaseAdmin
      .from('member_programs')
      .select('id, merchant_id, duration_months')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Programme non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si le client a déjà un programme actif pour ce commerçant
    const { data: existingCard } = await supabaseAdmin
      .from('member_cards')
      .select(`
        id,
        program:member_programs!inner (merchant_id)
      `)
      .eq('customer_id', customer_id)
      .eq('program.merchant_id', program.merchant_id)
      .single();

    if (existingCard) {
      return NextResponse.json(
        { error: 'Ce client est déjà inscrit à un programme membre' },
        { status: 400 }
      );
    }

    // Calculer la date de fin
    const validFrom = new Date();
    const validUntil = new Date();

    // Convert duration_months to days and add to date
    // duration_months values: days = X/30, weeks = X*0.25, months = X
    const durationMonths = program.duration_months;

    if (durationMonths >= 999) {
      // "Unlimited" = 100 years
      validUntil.setFullYear(validUntil.getFullYear() + 100);
    } else {
      // Convert to days: durationMonths * 30 days
      const days = Math.round(durationMonths * 30);
      validUntil.setDate(validUntil.getDate() + days);
    }

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .insert({
        program_id,
        customer_id,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      })
      .select(`
        *,
        customer:customers (*)
      `)
      .single();

    if (error) {
      console.error('Error creating member card:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memberCard });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
