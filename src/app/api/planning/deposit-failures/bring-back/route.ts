import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { fromZonedTime } from 'date-fns-tz';
import { getTimezoneForCountry } from '@/lib/utils';
import { computeDepositDeadline } from '@/lib/deposit';
import { sendBookingSms } from '@/lib/sms';
import logger from '@/lib/logger';

const bringBackSchema = z.object({
  merchantId: z.string().uuid(),
  failureId: z.string().uuid(),
  markDepositConfirmed: z.boolean(),
  sendSms: z.boolean().optional(),
});

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>,
  merchantId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const parsed = bringBackSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });

    const { merchantId, failureId, markDepositConfirmed, sendSms } = parsed.data;
    if (!(await verifyOwnership(supabase, merchantId, user.id))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: failure }, { data: merchant }] = await Promise.all([
      supabaseAdmin.from('booking_deposit_failures').select('*').eq('id', failureId).eq('merchant_id', merchantId).single(),
      supabaseAdmin.from('merchants').select('id, shop_name, country, locale, subscription_status, booking_mode, deposit_link, deposit_deadline_hours, buffer_minutes').eq('id', merchantId).single(),
    ]);

    if (!failure) return NextResponse.json({ error: 'Réservation archivée introuvable' }, { status: 404 });
    if (!merchant) return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });

    const serviceIds: string[] = failure.service_ids || [];
    let totalDuration = failure.total_duration_minutes as number | null;
    if (!totalDuration && serviceIds.length > 0) {
      const { data: svcs } = await supabaseAdmin
        .from('merchant_services')
        .select('duration')
        .in('id', serviceIds);
      totalDuration = (svcs || []).reduce((sum, s) => sum + (s.duration || 30), 0) || 30;
    }
    totalDuration = totalDuration || 30;

    const slotDate = failure.original_slot_date as string;
    const slotTimeShort = (failure.original_start_time as string).slice(0, 5);

    const isFreeMode = merchant.booking_mode === 'free';
    const hasDeposit = !!merchant.deposit_link;

    let depositDeadlineAt: string | null = null;
    if (!markDepositConfirmed && hasDeposit && merchant.deposit_deadline_hours) {
      const tz = getTimezoneForCountry(merchant.country);
      const rdvTime = fromZonedTime(new Date(`${slotDate}T${slotTimeShort}:00`), tz);
      const deadline = computeDepositDeadline(merchant.deposit_deadline_hours, rdvTime, tz);
      if (deadline) depositDeadlineAt = deadline.toISOString();
    }

    const bookedAt = new Date().toISOString();
    const depositConfirmedValue: boolean | null = markDepositConfirmed ? true : hasDeposit ? false : null;

    let restoredSlotId: string;

    if (isFreeMode) {
      const buffer = merchant.buffer_minutes ?? 0;
      const { data: sameDay } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('start_time, total_duration_minutes')
        .eq('merchant_id', merchantId)
        .eq('slot_date', slotDate)
        .not('client_name', 'is', null)
        .is('primary_slot_id', null);

      const requestedStart = timeToMinutes(slotTimeShort);
      const requestedEnd = requestedStart + totalDuration;
      const conflict = (sameDay || []).some(s => {
        const sStart = timeToMinutes(s.start_time);
        const sEnd = sStart + (s.total_duration_minutes ?? 30) + buffer;
        return requestedStart < sEnd && requestedEnd > sStart;
      });
      if (conflict) {
        return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
      }

      const { data: newSlot, error: insertErr } = await supabaseAdmin
        .from('merchant_planning_slots')
        .insert({
          merchant_id: merchantId,
          slot_date: slotDate,
          start_time: slotTimeShort,
          client_name: failure.client_name,
          client_phone: failure.client_phone,
          customer_id: failure.customer_id,
          total_duration_minutes: totalDuration,
          booked_online: false,
          booked_at: bookedAt,
          deposit_confirmed: depositConfirmedValue,
          deposit_deadline_at: depositDeadlineAt,
          notes: failure.notes,
        })
        .select('id')
        .single();

      if (insertErr || !newSlot) {
        logger.error('Bring-back insert error (free mode):', insertErr);
        return NextResponse.json({ error: 'Erreur lors de la restauration' }, { status: 500 });
      }
      restoredSlotId = newSlot.id;
    } else {
      const { data: daySlots } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('id, start_time, client_name')
        .eq('merchant_id', merchantId)
        .eq('slot_date', slotDate)
        .order('start_time');

      const primarySlot = (daySlots || []).find(s => s.start_time.slice(0, 5) === slotTimeShort && s.client_name === null);
      if (!primarySlot) {
        return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
      }

      const startMins = timeToMinutes(slotTimeShort);
      const endMins = startMins + totalDuration;
      const slotsToBlock = (daySlots || []).filter(s => {
        const mins = timeToMinutes(s.start_time);
        return mins >= startMins && mins < endMins;
      });
      const notFree = slotsToBlock.filter(s => s.client_name !== null);
      if (notFree.length > 0) {
        return NextResponse.json({ error: 'Certains créneaux ne sont plus disponibles' }, { status: 409 });
      }

      const fillerIds = slotsToBlock.map(s => s.id).filter(id => id !== primarySlot.id);

      const primaryUpdate = {
        client_name: failure.client_name,
        client_phone: failure.client_phone,
        customer_id: failure.customer_id,
        booked_online: false,
        booked_at: bookedAt,
        deposit_confirmed: depositConfirmedValue,
        deposit_deadline_at: depositDeadlineAt,
        notes: failure.notes,
      };

      const { error: primaryErr } = await supabaseAdmin
        .from('merchant_planning_slots')
        .update(primaryUpdate)
        .eq('id', primarySlot.id)
        .is('client_name', null);

      if (primaryErr) {
        logger.error('Bring-back primary update error:', primaryErr);
        return NextResponse.json({ error: 'Erreur lors de la restauration' }, { status: 500 });
      }

      if (fillerIds.length > 0) {
        await supabaseAdmin
          .from('merchant_planning_slots')
          .update({
            client_name: failure.client_name,
            client_phone: failure.client_phone,
            customer_id: failure.customer_id,
            primary_slot_id: primarySlot.id,
            booked_at: bookedAt,
          })
          .in('id', fillerIds);
      }

      restoredSlotId = primarySlot.id;
    }

    if (serviceIds.length > 0) {
      const rows = serviceIds.map(sid => ({ slot_id: restoredSlotId, service_id: sid }));
      const { error: svcErr } = await supabaseAdmin.from('planning_slot_services').insert(rows);
      if (svcErr) logger.error('Bring-back service insert error:', svcErr);
    }

    await supabaseAdmin
      .from('booking_deposit_failures')
      .delete()
      .eq('id', failureId)
      .eq('merchant_id', merchantId);

    if (sendSms && failure.client_phone) {
      const smsType = markDepositConfirmed ? 'confirmation_deposit' : 'confirmation_no_deposit';
      sendBookingSms(supabaseAdmin, {
        merchantId,
        slotId: restoredSlotId,
        phone: failure.client_phone,
        shopName: merchant.shop_name,
        date: slotDate,
        time: slotTimeShort,
        smsType,
        locale: merchant.locale || 'fr',
        subscriptionStatus: merchant.subscription_status,
      }).catch(err => logger.error('Bring-back SMS failed:', err));
    }

    return NextResponse.json({ success: true, slotId: restoredSlotId });
  } catch (error) {
    logger.error('Bring-back error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
