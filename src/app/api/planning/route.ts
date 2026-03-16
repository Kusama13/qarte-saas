import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getTodayForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>, merchantId: string, userId: string) {
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// ── GET: Fetch slots for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const isPublic = searchParams.get('public') === 'true';

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    if (isPublic) {
      // Public: use admin client to bypass RLS, but only return available future slots
      const supabaseAdmin = getSupabaseAdmin();
      // Fetch merchant country for timezone-aware date
      const { data: merchantRow } = await supabaseAdmin
        .from('merchants')
        .select('country')
        .eq('id', merchantId)
        .single();
      const today = getTodayForCountry(merchantRow?.country);
      const todayDate = new Date(today);
      todayDate.setDate(todayDate.getDate() + 30);
      const thirtyDaysLater = todayDate.toISOString().split('T')[0];

      const { data, error } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('slot_date, start_time')
        .eq('merchant_id', merchantId)
        .is('client_name', null)
        .gte('slot_date', today)
        .lte('slot_date', thirtyDaysLater)
        .order('slot_date')
        .order('start_time');

      if (error) {
        logger.error('Planning public GET error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      }

      return NextResponse.json({ slots: data || [] });
    }

    // Auth mode: merchant sees all their slots
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!await verifyOwnership(supabase, merchantId, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Use admin client to see all slots (including taken ones, bypassing public-only RLS)
    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, slot_date, start_time, client_name, client_phone, service_id, notes, created_at')
      .eq('merchant_id', merchantId)
      .order('slot_date')
      .order('start_time');

    if (from) query = query.gte('slot_date', from);
    if (to) query = query.lte('slot_date', to);

    const { data, error } = await query;

    if (error) {
      logger.error('Planning GET error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ slots: data || [] });
  } catch (error) {
    logger.error('Planning GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST: Create slot(s) in batch
const createSlotsSchema = z.object({
  merchantId: z.string().uuid(),
  slots: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSlotsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { merchantId, slots } = parsed.data;

    if (!await verifyOwnership(supabase, merchantId, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Check max 200 active future slots
    const supabaseAdmin = getSupabaseAdmin();
    const { data: planMerchant } = await supabaseAdmin
      .from('merchants')
      .select('country')
      .eq('id', merchantId)
      .single();
    const today = getTodayForCountry(planMerchant?.country);
    const { count } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .gte('slot_date', today);

    if ((count || 0) + slots.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 créneaux actifs' }, { status: 400 });
    }

    const rows = slots.map(s => ({
      merchant_id: merchantId,
      slot_date: s.date,
      start_time: s.time,
    }));

    // Use upsert with ignoreDuplicates to skip conflicts
    const { data, error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .upsert(rows, { onConflict: 'merchant_id,slot_date,start_time', ignoreDuplicates: true })
      .select();

    if (error) {
      logger.error('Planning POST error:', error);
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: data?.length || 0 });
  } catch (error) {
    logger.error('Planning POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── PATCH: Update a slot (mark as taken/free, edit client info)
const updateSlotSchema = z.object({
  slotId: z.string().uuid(),
  merchantId: z.string().uuid(),
  client_name: z.string().max(100).nullable(),
  client_phone: z.string().max(20).nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  service_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(300).nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { slotId, merchantId, client_name, client_phone, customer_id, service_id, notes } = parsed.data;

    if (!await verifyOwnership(supabase, merchantId, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {
      client_name: client_name?.trim() || null,
    };
    if (client_phone !== undefined) updateData.client_phone = client_phone?.trim() || null;
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (service_id !== undefined) updateData.service_id = service_id;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const { error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('merchant_id', merchantId);

    if (error) {
      logger.error('Planning PATCH error:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Planning PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── DELETE: Remove slot(s)
const deleteSlotsSchema = z.object({
  merchantId: z.string().uuid(),
  slotIds: z.array(z.string().uuid()).min(1).max(50),
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteSlotsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { merchantId, slotIds } = parsed.data;

    if (!await verifyOwnership(supabase, merchantId, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .delete()
      .eq('merchant_id', merchantId)
      .in('id', slotIds);

    if (error) {
      logger.error('Planning DELETE error:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Planning DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
