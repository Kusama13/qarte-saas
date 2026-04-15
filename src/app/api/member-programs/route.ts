import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const createProgramSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  benefit_label: z.string().min(1, "L'avantage est requis"),
  // Allow any positive duration: days (0.033+), weeks (0.25+), months (1+)
  duration_months: z.number().min(0.01).max(999).default(12),
  discount_percent: z.number().int().refine(v => [5, 10, 15, 20].includes(v)).nullable().optional(),
  skip_deposit: z.boolean().optional().default(false),
});

// GET: Liste des programmes du commerçant
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerçant non trouvé' }, { status: 404 });
    }

    // Get programs with member count
    const { data: programs, error } = await supabaseAdmin
      .from('member_programs')
      .select(`
        *,
        member_cards (count)
      `)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching programs:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ programs });
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Créer un nouveau programme
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProgramSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerçant non trouvé' }, { status: 404 });
    }

    const { name, benefit_label, duration_months, discount_percent, skip_deposit } = validation.data;

    // Create program
    const { data: program, error } = await supabaseAdmin
      .from('member_programs')
      .insert({
        merchant_id: merchant.id,
        name,
        benefit_label,
        duration_months,
        is_active: true,
        discount_percent: discount_percent ?? null,
        skip_deposit: skip_deposit ?? false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating program:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
