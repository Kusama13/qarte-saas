import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getTodayForCountry, formatPhoneNumber, getAllPhoneFormats } from '@/lib/utils';
import { sendBookingSms } from '@/lib/sms';
import type { MerchantCountry } from '@/types';
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
      .select('id, slot_date, start_time, client_name, client_phone, customer_id, service_id, notes, deposit_confirmed, deposit_deadline_at, primary_slot_id, created_at, planning_slot_services(service_id, service:merchant_services!service_id(name)), planning_slot_photos(id, url, position), planning_slot_result_photos(id, url, position), customer:customers!customer_id(instagram_handle, tiktok_handle, facebook_url)')
      .eq('merchant_id', merchantId)
      .order('slot_date')
      .order('start_time');

    if (from) query = query.gte('slot_date', from);
    else if (!searchParams.get('customerId')) {
      // Default: 90 days ago to avoid unbounded queries
      const d = new Date(); d.setDate(d.getDate() - 90);
      query = query.gte('slot_date', d.toISOString().split('T')[0]);
    }
    if (to) query = query.lte('slot_date', to);
    if (searchParams.get('booked') === 'true') query = query.not('client_name', 'is', null);
    const customerId = searchParams.get('customerId');
    if (customerId) query = query.eq('customer_id', customerId);
    query = query.limit(1000);

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

    // Check max 500 active future slots (~2 months for a busy salon)
    const MAX_ACTIVE_SLOTS = 500;
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

    const current = count || 0;
    if (current + slots.length > MAX_ACTIVE_SLOTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ACTIVE_SLOTS} créneaux actifs (vous en avez ${current}). Supprimez d'anciens créneaux pour en ajouter.` },
        { status: 400 }
      );
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
  service_id: z.string().uuid().nullable().optional(), // deprecated
  service_ids: z.array(z.string().uuid()).max(10).optional(),
  notes: z.string().max(300).nullable().optional(),
  deposit_confirmed: z.boolean().nullable().optional(),
  phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
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

    const { slotId, merchantId, client_name, client_phone, customer_id, service_ids, notes, deposit_confirmed } = parsed.data;

    if (!await verifyOwnership(supabase, merchantId, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const trimmedName = client_name?.trim() || null;
    const updateData: Record<string, unknown> = {
      client_name: trimmedName,
    };
    // Set booked_at when assigning a client to a slot (manual booking)
    if (trimmedName) {
      updateData.booked_at = new Date().toISOString();
    }
    if (client_phone !== undefined) {
      if (client_phone) {
        // Format phone to E.164 using merchant country
        const { data: phoneMerchant } = await supabaseAdmin
          .from('merchants')
          .select('country')
          .eq('id', merchantId)
          .single();
        const country = (parsed.data.phone_country || phoneMerchant?.country || 'FR') as MerchantCountry;
        updateData.client_phone = formatPhoneNumber(client_phone.trim(), country);
      } else {
        updateData.client_phone = null;
      }
    }
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (deposit_confirmed !== undefined) updateData.deposit_confirmed = deposit_confirmed;

    // Run slot update and services junction update in parallel
    const slotUpdatePromise = supabaseAdmin
      .from('merchant_planning_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('merchant_id', merchantId);

    const serviceUpdatePromise = service_ids !== undefined
      ? supabaseAdmin
          .from('planning_slot_services')
          .delete()
          .eq('slot_id', slotId)
          .then(async () => {
            if (service_ids.length > 0) {
              const rows = service_ids.map(sid => ({ slot_id: slotId, service_id: sid }));
              const { error: svcError } = await supabaseAdmin
                .from('planning_slot_services')
                .insert(rows);
              if (svcError) logger.error('Planning slot services insert error:', svcError);
            }
          })
      : Promise.resolve();

    // If clearing a slot (client_name → null), also clear its filler slots
    const clearFillersPromise = (client_name === null || client_name === '')
      ? supabaseAdmin
          .from('merchant_planning_slots')
          .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null, deposit_deadline_at: null, primary_slot_id: null })
          .eq('primary_slot_id', slotId)
          .eq('merchant_id', merchantId)
      : Promise.resolve({ error: null });

    const [{ error }, , { error: fillerError }] = await Promise.all([slotUpdatePromise, serviceUpdatePromise, clearFillersPromise]);

    if (error || fillerError) {
      logger.error('Planning PATCH error:', error || fillerError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // SMS confirmation when deposit is confirmed
    if (deposit_confirmed === true) {
      const [{ data: smsSlot }, { data: smsMerchant }] = await Promise.all([
        supabaseAdmin.from('merchant_planning_slots').select('client_phone, slot_date, start_time').eq('id', slotId).single(),
        supabaseAdmin.from('merchants').select('shop_name, locale, subscription_status').eq('id', merchantId).single(),
      ]);
      if (smsSlot?.client_phone && smsMerchant) {
        sendBookingSms(supabaseAdmin, {
          merchantId,
          slotId,
          phone: smsSlot.client_phone,
          shopName: smsMerchant.shop_name,
          date: smsSlot.slot_date,
          time: smsSlot.start_time,
          smsType: 'confirmation_deposit',
          locale: smsMerchant.locale || 'fr',
          subscriptionStatus: smsMerchant.subscription_status,
        }).catch(() => {});
      }
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
  slotIds: z.array(z.string().uuid()).min(1).max(200),
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

    // Also delete filler slots linked to any deleted primary slot
    await supabaseAdmin
      .from('merchant_planning_slots')
      .delete()
      .eq('merchant_id', merchantId)
      .in('primary_slot_id', slotIds);

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
