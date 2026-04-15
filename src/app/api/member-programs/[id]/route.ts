import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const updateProgramSchema = z.object({
  name: z.string().min(1).optional(),
  benefit_label: z.string().min(1).optional(),
  duration_months: z.number().min(0.01).max(999).optional(),
  is_active: z.boolean().optional(),
  discount_percent: z.number().int().refine(v => [5, 10, 15, 20].includes(v)).nullable().optional(),
  skip_deposit: z.boolean().optional(),
}).strict();

const supabaseAdmin = getSupabaseAdmin();

// GET: Récupérer un programme avec ses membres
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerSupabaseClient();
    

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Verify user owns a merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: program, error } = await supabaseAdmin
      .from('member_programs')
      .select(`
        *,
        member_cards (
          id,
          customer_id,
          valid_from,
          valid_until,
          created_at,
          customer:customers (id, first_name, last_name, phone_number)
        )
      `)
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ program });
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH: Modifier un programme
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerSupabaseClient();
    

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Verify user owns a merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateProgramSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validation.data)) {
      if (value !== undefined) updateData[key] = value;
    }

    const { data: program, error } = await supabaseAdmin
      .from('member_programs')
      .update(updateData)
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ program });
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: Supprimer un programme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerSupabaseClient();
    

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Verify user owns a merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('member_programs')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchant.id);

    if (error) {
      return NextResponse.json({ error: 'Programme non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
