import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getTodayForCountry, formatPhoneNumber, getAllPhoneFormats } from '@/lib/utils';
import { sendBookingSms } from '@/lib/sms';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';
import { requirePlanFeature } from '@/lib/api-helpers';
import { recomputeDayTravel } from '@/lib/travel-recompute';

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
      todayDate.setDate(todayDate.getDate() + 60);
      const sixtyDaysLater = todayDate.toISOString().split('T')[0];

      const { data, error } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('slot_date, start_time')
        .eq('merchant_id', merchantId)
        .is('client_name', null)
        .gte('slot_date', today)
        .lte('slot_date', sixtyDaysLater)
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
      .select('id, slot_date, start_time, client_name, client_phone, customer_id, service_id, notes, deposit_confirmed, deposit_deadline_at, primary_slot_id, total_duration_minutes, custom_service_name, custom_service_duration, custom_service_price, custom_service_color, customer_address, customer_lat, customer_lng, travel_time_minutes, travel_time_overridden, created_at, planning_slot_services(service_id, service:merchant_services!service_id(name)), planning_slot_photos(id, url, position), planning_slot_result_photos(id, url, position), customer:customers!customer_id(instagram_handle, tiktok_handle, facebook_url)')
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
    if (searchParams.get('booked') === 'true') query = query.not('client_name', 'is', null).neq('client_name', '__blocked__');
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
    const tierBlock = await requirePlanFeature(supabase, merchantId, 'planning');
    if (tierBlock) return tierBlock;

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
  custom_service_name: z.string().max(100).nullable().optional(),
  custom_service_duration: z.number().int().positive().max(720).nullable().optional(),
  custom_service_price: z.number().min(0).max(100_000).nullable().optional(),
  custom_service_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  notes: z.string().max(300).nullable().optional(),
  deposit_confirmed: z.boolean().nullable().optional(),
  phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
  send_sms: z.boolean().optional(),
  send_sms_cancel: z.boolean().optional(),
  // Mode libre: après avoir vidé un slot (annulation), on le supprime entièrement.
  // Évite le slot fantôme qui bloque la recréation sur le même horaire.
  delete_if_empty: z.boolean().optional(),
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

    const { slotId, merchantId, client_name, client_phone, customer_id, service_ids, custom_service_name, custom_service_duration, custom_service_price, custom_service_color, notes, deposit_confirmed, send_sms, send_sms_cancel, delete_if_empty } = parsed.data;

    if (!await verifyOwnership(supabase, merchantId, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const trimmedName = client_name?.trim() || null;

    // Fetch previous state to detect create vs edit — evite de reset booked_at
    // a chaque edit (regression : sinon les "nouvelles resa" apparaissent a la
    // mauvaise date cote tracking / HeroToday).
    const { data: existingSlot } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('client_name, booked_at, slot_date')
      .eq('id', slotId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    const wasBooked = !!existingSlot?.client_name;

    const updateData: Record<string, unknown> = {
      client_name: trimmedName,
    };
    if (trimmedName && !wasBooked) {
      // Transition empty -> booked : timestamp le moment de la prise du RDV
      updateData.booked_at = new Date().toISOString();
    } else if (!trimmedName) {
      // Clearing the slot: reset booking metadata so the slot is truly available again
      updateData.booked_online = false;
      updateData.booked_at = null;
      updateData.deposit_confirmed = null;
      updateData.deposit_deadline_at = null;
    }
    // else : edition d'une resa existante, on preserve booked_at
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
    // Annulation : reset complet de la prestation perso pour eviter les fantomes,
    // meme si le client n'a pas explicitement envoye les custom_* dans le payload.
    if (!trimmedName) {
      updateData.custom_service_duration = null;
      updateData.custom_service_name = null;
      updateData.custom_service_price = null;
      updateData.custom_service_color = null;
      // Reset home-service fields too — slot is freed, address shouldn't linger
      updateData.customer_address = null;
      updateData.customer_lat = null;
      updateData.customer_lng = null;
      updateData.travel_time_minutes = null;
      updateData.travel_time_overridden = false;
    } else {
      if (custom_service_duration !== undefined) updateData.custom_service_duration = custom_service_duration;
      if (custom_service_name !== undefined) updateData.custom_service_name = custom_service_name?.trim() || null;
      if (custom_service_price !== undefined) updateData.custom_service_price = custom_service_price;
      if (custom_service_color !== undefined) updateData.custom_service_color = custom_service_color;
    }

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

    // Recalculate duration / fillers when catalog services OR custom prestation change
    const servicesChanged = service_ids !== undefined;
    const customDurationChanged = custom_service_duration !== undefined;
    if ((servicesChanged || customDurationChanged) && trimmedName) {
      const { data: slotMeta } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('total_duration_minutes, slot_date, start_time, client_phone, customer_id, custom_service_duration, planning_slot_services(service_id)')
        .eq('id', slotId)
        .single();

      // Fallback aux IDs catalogue existants si le payload ne les inclut pas
      // (sinon : update partiel = perte de la durée des autres composants)
      const effectiveServiceIds = service_ids ?? (slotMeta?.planning_slot_services?.map((r: { service_id: string }) => r.service_id) ?? []);
      const { data: svcs } = effectiveServiceIds.length > 0
        ? await supabaseAdmin.from('merchant_services').select('duration').in('id', effectiveServiceIds)
        : { data: [] };
      const catalogDuration = (svcs || []).reduce((sum, s) => sum + (s.duration || 30), 0);
      const customDuration = custom_service_duration ?? slotMeta?.custom_service_duration ?? 0;
      const newDuration = (catalogDuration + customDuration) || 30;

      if (slotMeta?.total_duration_minutes != null) {
        // Mode libre — recalculate total_duration_minutes
        updateData.total_duration_minutes = newDuration;
      } else if (slotMeta) {
        // Mode créneaux — recalculate filler slots
        const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const startMins = toMins(slotMeta.start_time);
        const endMins = startMins + newDuration;

        // 1. Clear all existing fillers for this slot
        await supabaseAdmin
          .from('merchant_planning_slots')
          .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null, deposit_deadline_at: null, primary_slot_id: null, booked_online: false, booked_at: null, customer_address: null, customer_lat: null, customer_lng: null, travel_time_minutes: null, travel_time_overridden: false })
          .eq('primary_slot_id', slotId)
          .eq('merchant_id', merchantId);

        // 2. Block new fillers if duration spans multiple slots
        const { data: daySlots } = await supabaseAdmin
          .from('merchant_planning_slots')
          .select('id, start_time, client_name')
          .eq('merchant_id', merchantId)
          .eq('slot_date', slotMeta.slot_date)
          .neq('id', slotId)
          .is('primary_slot_id', null)
          .order('start_time');

        const newFillers = (daySlots || []).filter(s => {
          const mins = toMins(s.start_time);
          return mins > startMins && mins < endMins && s.client_name === null;
        });

        if (newFillers.length > 0) {
          const fillerPhone = (updateData.client_phone as string | null) ?? slotMeta.client_phone;
          const fillerCustomerId = (updateData.customer_id as string | null) ?? slotMeta.customer_id;
          await supabaseAdmin
            .from('merchant_planning_slots')
            .update({
              client_name: trimmedName,
              client_phone: fillerPhone,
              customer_id: fillerCustomerId,
              primary_slot_id: slotId,
              booked_online: true,
              booked_at: new Date().toISOString(),
            })
            .in('id', newFillers.map(f => f.id));
        }
      }
    }

    // SMS cancellation — fetch slot data before clearing (phone will be erased)
    if (send_sms_cancel && (client_name === null || client_name === '')) {
      const [{ data: cancelSlot }, { data: cancelMerchant }] = await Promise.all([
        supabaseAdmin.from('merchant_planning_slots').select('client_phone, slot_date, start_time').eq('id', slotId).single(),
        supabaseAdmin.from('merchants').select('shop_name, locale, subscription_status').eq('id', merchantId).single(),
      ]);
      if (cancelSlot?.client_phone && cancelMerchant) {
        sendBookingSms(supabaseAdmin, {
          merchantId,
          slotId,
          phone: cancelSlot.client_phone,
          shopName: cancelMerchant.shop_name,
          date: cancelSlot.slot_date,
          time: cancelSlot.start_time,
          smsType: 'booking_cancelled',
          locale: cancelMerchant.locale || 'fr',
          subscriptionStatus: cancelMerchant.subscription_status,
        }).catch(() => {});
      }
    }

    // If clearing a slot (client_name → null), also clear its filler slots
    const clearFillersPromise = (client_name === null || client_name === '')
      ? supabaseAdmin
          .from('merchant_planning_slots')
          .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null, deposit_deadline_at: null, primary_slot_id: null, booked_online: false, booked_at: null, customer_address: null, customer_lat: null, customer_lng: null, travel_time_minutes: null, travel_time_overridden: false })
          .eq('primary_slot_id', slotId)
          .eq('merchant_id', merchantId)
      : Promise.resolve({ error: null });

    const [{ error }, , { error: fillerError }] = await Promise.all([slotUpdatePromise, serviceUpdatePromise, clearFillersPromise]);

    if (error || fillerError) {
      logger.error('Planning PATCH error:', error || fillerError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    const smsType: 'confirmation_deposit' | 'confirmation_no_deposit' | null =
      (send_sms && deposit_confirmed === true) ? 'confirmation_deposit'
      : send_sms ? 'confirmation_no_deposit'
      : null;

    if (smsType) {
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
          smsType,
          locale: smsMerchant.locale || 'fr',
          subscriptionStatus: smsMerchant.subscription_status,
        }).catch(() => {});
      }
    }

    if (delete_if_empty && (client_name === null || client_name === '')) {
      await supabaseAdmin
        .from('merchant_planning_slots')
        .delete()
        .eq('id', slotId)
        .eq('merchant_id', merchantId);
    }

    // Home-service: cancellation/edit may shift the predecessor of remaining
    // slots — recompute the day's travel times.
    if (existingSlot?.slot_date) {
      try {
        await recomputeDayTravel(merchantId, existingSlot.slot_date);
      } catch (err) {
        logger.warn('recomputeDayTravel after PATCH failed', { err: String(err) });
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

    // Capture distinct slot_dates BEFORE deletion so we can recompute travel afterwards
    const { data: deletedSlots } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('slot_date')
      .in('id', slotIds);
    const affectedDates = Array.from(new Set((deletedSlots || []).map((s) => s.slot_date)));

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

    for (const date of affectedDates) {
      try {
        await recomputeDayTravel(merchantId, date);
      } catch (err) {
        logger.warn('recomputeDayTravel after DELETE failed', { date, err: String(err) });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Planning DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
