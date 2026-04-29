import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { sendBookingSms } from '@/lib/sms';
import logger from '@/lib/logger';
import { recomputeDayTravel } from '@/lib/travel-recompute';

const shiftSlotSchema = z.object({
  merchantId: z.string().uuid(),
  slotId: z.string().uuid(),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // If true, delete an empty target slot to make room for the move (used when moving a booked slot).
  // If false (default, used for drag & drop of empty slots), reject on any target conflict.
  force: z.boolean().optional(),
  send_sms: z.boolean().optional(),
});

// POST — shift a slot to a new time and/or date
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = shiftSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    const { merchantId, slotId, newTime, newDate, force, send_sms } = parsed.data;

    // Verify ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the slot to shift (include total_duration_minutes for free mode overlap check)
    const { data: slot } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, slot_date, start_time, client_name, total_duration_minutes')
      .eq('id', slotId)
      .eq('merchant_id', merchantId)
      .single();

    if (!slot) {
      return NextResponse.json({ error: 'Creneau introuvable' }, { status: 404 });
    }

    const targetDate = newDate || slot.slot_date;

    // Booked slot with force flag → use the atomic RPC that transfers booking data
    // (source stays in grid as a free slot, target is created or reused)
    if (slot.client_name && force) {
      // Free mode: check for OVERLAP with existing bookings at target date/time
      // The RPC only checks exact start_time match; we need range overlap
      const { data: merchantData } = await supabaseAdmin
        .from('merchants')
        .select('booking_mode, buffer_minutes')
        .eq('id', merchantId)
        .single();

      if (merchantData?.booking_mode === 'free') {
        const { data: existingBookings } = await supabaseAdmin
          .from('merchant_planning_slots')
          .select('start_time, total_duration_minutes')
          .eq('merchant_id', merchantId)
          .eq('slot_date', targetDate)
          .not('client_name', 'is', null)
          .neq('id', slotId)
          .is('primary_slot_id', null);

        const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const buffer = merchantData.buffer_minutes ?? 0;
        const moveDuration = slot.total_duration_minutes ?? 60;
        const moveStart = toMins(newTime);
        const moveEnd = moveStart + moveDuration;

        const hasConflict = (existingBookings || []).some(b => {
          const bStart = toMins(b.start_time);
          const bEnd = bStart + (b.total_duration_minutes ?? 60) + buffer;
          return moveStart < bEnd && moveEnd > bStart;
        });

        if (hasConflict) {
          return NextResponse.json({ error: 'Un RDV existe déjà sur cette plage' }, { status: 409 });
        }
      }

      const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('move_booking', {
        p_merchant_id: merchantId,
        p_source_slot_id: slotId,
        p_target_date: targetDate,
        p_target_time: newTime,
      });
      if (rpcErr) {
        logger.error('Planning move_booking RPC error:', rpcErr);
        return NextResponse.json({ error: 'Erreur lors du deplacement' }, { status: 500 });
      }
      const result = rpcData as { success: boolean; error?: string; target_id?: string };
      if (!result.success) {
        const errorMap: Record<string, { status: number; message: string }> = {
          source_not_found: { status: 404, message: 'Creneau introuvable' },
          source_not_booked: { status: 400, message: 'Le creneau n\'a pas de reservation' },
          multi_slot_not_supported: { status: 400, message: 'Deplacement des resas multi-creneaux pas encore supporte' },
          target_already_booked: { status: 409, message: 'Un RDV existe deja a cette heure' },
        };
        const mapped = errorMap[result.error || ''] || { status: 500, message: 'Erreur lors du deplacement' };
        return NextResponse.json({ error: mapped.message }, { status: mapped.status });
      }
      // SMS notification to client about moved booking (opt-in)
      if (send_sms && result.target_id) {
        const [{ data: movedSlot }, { data: smsMerchant }] = await Promise.all([
          supabaseAdmin.from('merchant_planning_slots').select('client_phone, slot_date, start_time').eq('id', result.target_id).single(),
          supabaseAdmin.from('merchants').select('shop_name, locale, subscription_status').eq('id', merchantId).single(),
        ]);
        if (movedSlot?.client_phone && smsMerchant) {
          sendBookingSms(supabaseAdmin, {
            merchantId,
            slotId: result.target_id,
            phone: movedSlot.client_phone,
            shopName: smsMerchant.shop_name,
            date: movedSlot.slot_date,
            time: movedSlot.start_time,
            smsType: 'booking_moved',
            locale: smsMerchant.locale || 'fr',
            subscriptionStatus: smsMerchant.subscription_status,
          }).catch(() => {});
        }
      }

      // Free mode: copy total_duration_minutes to target (move_booking RPC doesn't handle it)
      if (result.target_id && slot.total_duration_minutes != null) {
        await supabaseAdmin
          .from('merchant_planning_slots')
          .update({ total_duration_minutes: slot.total_duration_minutes })
          .eq('id', result.target_id);
      }

      // Home-service: recompute travel times on both source and target days
      // (the moved slot changes the predecessor of any later booking on each day).
      const datesToRecompute = new Set<string>([slot.slot_date, targetDate]);
      for (const date of datesToRecompute) {
        try {
          await recomputeDayTravel(merchantId, date);
        } catch (err) {
          logger.warn('recomputeDayTravel after shift failed', { date, err: String(err) });
        }
      }

      return NextResponse.json({ success: true, target_id: result.target_id });
    }

    // Empty slot shift (drag & drop) — simple update path
    const { data: conflict } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, client_name')
      .eq('merchant_id', merchantId)
      .eq('slot_date', targetDate)
      .eq('start_time', newTime)
      .neq('id', slotId)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Un creneau existe deja a cette heure' }, { status: 409 });
    }

    const updateData: Record<string, string> = { start_time: newTime };
    if (newDate) updateData.slot_date = newDate;

    const { error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('merchant_id', merchantId);

    if (error) {
      logger.error('Planning shift-slot error:', error);
      return NextResponse.json({ error: 'Erreur lors du decalage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Planning shift-slot error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
