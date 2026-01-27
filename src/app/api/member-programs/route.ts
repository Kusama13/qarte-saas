import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createProgramSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  benefit_label: z.string().min(1, "L'avantage est requis"),
  // Allow any positive duration: days (0.033+), weeks (0.25+), months (1+)
  duration_months: z.number().min(0.01).max(999).default(12),
});

// GET: Liste des programmes du commerçant
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

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
      console.error('Error fetching programs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ programs });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Créer un nouveau programme
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

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

    const { name, benefit_label, duration_months } = validation.data;

    // Create program
    const { data: program, error } = await supabaseAdmin
      .from('member_programs')
      .insert({
        merchant_id: merchant.id,
        name,
        benefit_label,
        duration_months,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating program:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
