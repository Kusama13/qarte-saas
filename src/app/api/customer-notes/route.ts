import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// ── GET: List notes for a customer
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const merchantId = searchParams.get('merchantId');
    const pinnedOnly = searchParams.get('pinned') === 'true';

    if (!customerId || !merchantId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Verify merchant ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    let query = supabaseAdmin
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (pinnedOnly) {
      query = query.eq('pinned', true);
    }

    const { data: notes, error } = await query;

    if (error) {
      logger.error('Customer notes fetch error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    logger.error('Customer notes GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST: Create a note
const createSchema = z.object({
  customer_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  slot_id: z.string().uuid().nullable().optional(),
  content: z.string().min(1).max(2000),
  note_type: z.string().min(1).max(50).default('general'),
  pinned: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { customer_id, merchant_id, slot_id, content, note_type, pinned } = parsed.data;

    // Verify merchant ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: note, error } = await supabaseAdmin
      .from('customer_notes')
      .insert({
        customer_id,
        merchant_id,
        slot_id: slot_id || null,
        content: content.trim(),
        note_type,
        pinned,
      })
      .select()
      .single();

    if (error) {
      logger.error('Customer note creation error:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    logger.error('Customer notes POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── PATCH: Update a note
const updateSchema = z.object({
  note_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  content: z.string().min(1).max(2000).optional(),
  note_type: z.string().min(1).max(50).optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { note_id, merchant_id, content, note_type, pinned } = parsed.data;

    // Verify merchant ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content.trim();
    if (note_type !== undefined) updateData.note_type = note_type;
    if (pinned !== undefined) updateData.pinned = pinned;

    const { error } = await supabaseAdmin
      .from('customer_notes')
      .update(updateData)
      .eq('id', note_id)
      .eq('merchant_id', merchant_id);

    if (error) {
      logger.error('Customer note update error:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customer notes PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── DELETE: Remove a note
const deleteSchema = z.object({
  note_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parsed = deleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { note_id, merchant_id } = parsed.data;

    // Verify merchant ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('customer_notes')
      .delete()
      .eq('id', note_id)
      .eq('merchant_id', merchant_id);

    if (error) {
      logger.error('Customer note delete error:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customer notes DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
