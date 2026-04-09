import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { resend, EMAIL_FROM, EMAIL_HEADERS } from '@/lib/resend';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sendMerchantPush } from '@/lib/merchant-push';
import { getTodayForCountry, formatDate } from '@/lib/utils';
import logger from '@/lib/logger';

const cancelSchema = z.object({
  slot_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
});

const rescheduleSchema = z.object({
  slot_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  new_time: z.string().regex(/^\d{2}:\d{2}$/),
});

// ── Helpers ──────────────────────────────────────────────────────────

function daysUntil(slotDate: string, today: string): number {
  const slot = new Date(slotDate + 'T00:00:00Z');
  const now = new Date(today + 'T00:00:00Z');
  return Math.floor((slot.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Shared pre-checks ────────────────────────────────────────────────

async function commonChecks(
  request: NextRequest,
  slotId: string,
  merchantId: string,
  permissionField: 'allow_customer_cancel' | 'allow_customer_reschedule',
) {
  // Rate limit: 5/min per IP
  const ip = getClientIP(request);
  const rl = checkRateLimit(`customer-edit:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!rl.success) {
    return { error: rateLimitResponse(rl.resetTime) };
  }

  // Auth
  const phone = getAuthenticatedPhone(request);
  if (!phone) {
    return { error: NextResponse.json({ error: 'Non autorise' }, { status: 401 }) };
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Fetch merchant
  const { data: merchant, error: merchantErr } = await supabaseAdmin
    .from('merchants')
    .select('id, allow_customer_cancel, allow_customer_reschedule, cancel_deadline_days, reschedule_deadline_days, country, shop_name, locale, user_id, booking_mode, buffer_minutes')
    .eq('id', merchantId)
    .single();

  if (merchantErr || !merchant) {
    return { error: NextResponse.json({ error: 'Commercant introuvable' }, { status: 404 }) };
  }

  // Check permission
  if (!merchant[permissionField]) {
    return { error: NextResponse.json({ error: 'Cette action n\'est pas autorisee par le commercant' }, { status: 403 }) };
  }

  // Fetch slot + customer in parallel
  const [slotResult, customerResult] = await Promise.all([
    supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, slot_date, start_time, client_name, client_phone, customer_id, booked_online, primary_slot_id, total_duration_minutes')
      .eq('id', slotId)
      .eq('merchant_id', merchantId)
      .single(),
    supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone_number', phone)
      .eq('merchant_id', merchantId)
      .maybeSingle(),
  ]);

  const slot = slotResult.data;
  if (!slot) {
    return { error: NextResponse.json({ error: 'Creneau introuvable' }, { status: 404 }) };
  }

  const customer = customerResult.data;
  if (!customer || slot.customer_id !== customer.id) {
    return { error: NextResponse.json({ error: 'Non autorise' }, { status: 403 }) };
  }

  // Must be online booking
  // Deadline check
  const today = getTodayForCountry(merchant.country);
  const days = daysUntil(slot.slot_date, today);
  const deadlineDays = permissionField === 'allow_customer_cancel'
    ? Number(merchant.cancel_deadline_days || 0)
    : Number(merchant.reschedule_deadline_days || 0);
  if (days < deadlineDays) {
    return { error: NextResponse.json({ error: 'Le delai de modification est depasse' }, { status: 403 }) };
  }

  // Must NOT be a filler slot
  if (slot.primary_slot_id) {
    return { error: NextResponse.json({ error: 'Ce creneau ne peut pas etre modifie directement' }, { status: 403 }) };
  }

  return { supabaseAdmin, merchant, slot };
}

// ── DELETE — Cancel a booking ────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    const { slot_id, merchant_id } = parsed.data;
    const checks = await commonChecks(request, slot_id, merchant_id, 'allow_customer_cancel');
    if ('error' in checks) return checks.error;

    const { supabaseAdmin, merchant, slot } = checks;
    const isFreeMod = merchant.booking_mode === 'free';

    if (isFreeMod) {
      // Mode libre: delete slot entirely (no empty slots in libre)
      await Promise.all([
        supabaseAdmin.from('planning_slot_services').delete().eq('slot_id', slot_id),
        supabaseAdmin.from('merchant_planning_slots').delete().eq('id', slot_id),
      ]);
    } else {
      // Mode créneaux: clear slot data (slot stays as empty/available)
      const { error: updateErr } = await supabaseAdmin
        .from('merchant_planning_slots')
        .update({
          client_name: null,
          client_phone: null,
          customer_id: null,
          deposit_confirmed: null,
          deposit_deadline_at: null,
          booked_online: false,
          booked_at: null,
        })
        .eq('id', slot_id);

      if (updateErr) {
        logger.error('customer-edit DELETE update error:', updateErr);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      }

      // Delete fillers + services in parallel
      await Promise.all([
        supabaseAdmin.from('merchant_planning_slots').delete().eq('primary_slot_id', slot_id),
        supabaseAdmin.from('planning_slot_services').delete().eq('slot_id', slot_id),
      ]);
    }

    const formattedDate = formatDate(slot.slot_date);

    // Fire-and-forget: push notification
    sendMerchantPush({
      supabase: supabaseAdmin,
      merchantId: merchant_id,
      notificationType: 'booking_cancelled',
      referenceId: slot_id,
      title: 'RDV annule',
      body: `${slot.client_name} a annule son RDV du ${formattedDate} a ${slot.start_time}`,
      url: `/dashboard/planning?date=${slot.slot_date}`,
    }).catch(() => {});

    // Fire-and-forget: email notification
    (async () => {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
        if (authUser?.user?.email) {
          resend?.emails.send({
            from: EMAIL_FROM,
            headers: EMAIL_HEADERS,
            to: authUser.user.email,
            subject: `RDV annule — ${slot.client_name}`,
            text: `${slot.client_name} a annule son RDV du ${formattedDate} a ${slot.start_time}.\n\nConnecte-toi sur ton dashboard pour voir tes reservations.\nhttps://getqarte.com/dashboard/planning`,
          }).catch(() => {});
        }
      } catch {
        // silent
      }
    })();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('customer-edit DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── PATCH — Reschedule a booking ─────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    const { slot_id, merchant_id, new_date, new_time } = parsed.data;
    const checks = await commonChecks(request, slot_id, merchant_id, 'allow_customer_reschedule');
    if ('error' in checks) return checks.error;

    const { supabaseAdmin, merchant, slot } = checks;
    const isFreeMod = merchant.booking_mode === 'free';

    let newSlotId: string;

    if (isFreeMod) {
      // Mode libre: delete old slot + create new one at target date/time
      const duration = slot.total_duration_minutes ?? 60;
      const buffer = merchant.buffer_minutes ?? 0;

      // Check overlap at target
      const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const { data: existing } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('start_time, total_duration_minutes')
        .eq('merchant_id', merchant_id)
        .eq('slot_date', new_date)
        .not('client_name', 'is', null)
        .neq('id', slot_id)
        .is('primary_slot_id', null);

      const newStart = toMins(new_time);
      const newEnd = newStart + duration;
      const conflict = (existing || []).some(b => {
        const bStart = toMins(b.start_time);
        const bEnd = bStart + (b.total_duration_minutes ?? 30) + buffer;
        return newStart < bEnd && newEnd > bStart;
      });
      if (conflict) {
        return NextResponse.json({ error: 'Un RDV existe deja a cette heure' }, { status: 409 });
      }

      // Create new slot with booking data
      const { data: newSlot, error: insertErr } = await supabaseAdmin
        .from('merchant_planning_slots')
        .insert({
          merchant_id: merchant_id,
          slot_date: new_date,
          start_time: new_time,
          client_name: slot.client_name,
          client_phone: slot.client_phone,
          customer_id: slot.customer_id,
          total_duration_minutes: duration,
          booked_online: true,
          booked_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertErr || !newSlot) {
        logger.error('customer-edit PATCH free mode insert error:', insertErr);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      }

      // Move services to new slot
      await supabaseAdmin
        .from('planning_slot_services')
        .update({ slot_id: newSlot.id })
        .eq('slot_id', slot_id);

      // Delete old slot
      await supabaseAdmin
        .from('merchant_planning_slots')
        .delete()
        .eq('id', slot_id);

      newSlotId = newSlot.id;
    } else {
      // Mode créneaux: find existing free slot
      const { data: targetSlot } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('id')
        .eq('merchant_id', merchant_id)
        .eq('slot_date', new_date)
        .eq('start_time', new_time)
        .is('client_name', null)
        .single();

      if (!targetSlot) {
        return NextResponse.json({ error: 'Ce creneau n\'est pas disponible' }, { status: 400 });
      }

      // Try atomic RPC first
      const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('move_booking', {
        p_merchant_id: merchant_id,
        p_source_slot_id: slot_id,
        p_target_date: new_date,
        p_target_time: new_time,
      });

      if (rpcErr) {
        logger.warn('customer-edit PATCH move_booking RPC error, using fallback:', rpcErr);

        const { error: clearErr } = await supabaseAdmin
          .from('merchant_planning_slots')
          .update({
            client_name: null,
            client_phone: null,
            customer_id: null,
            deposit_confirmed: null,
            deposit_deadline_at: null,
            booked_online: false,
            booked_at: null,
          })
          .eq('id', slot_id);

        if (clearErr) {
          logger.error('customer-edit PATCH fallback clear error:', clearErr);
          return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
        }

        const { error: fillErr } = await supabaseAdmin
          .from('merchant_planning_slots')
          .update({
            client_name: slot.client_name,
            client_phone: slot.client_phone,
            customer_id: slot.customer_id,
            deposit_confirmed: null,
            deposit_deadline_at: null,
            booked_online: true,
            booked_at: new Date().toISOString(),
          })
          .eq('id', targetSlot.id);

        if (fillErr) {
          logger.error('customer-edit PATCH fallback fill error:', fillErr);
          return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
        }

        await supabaseAdmin
          .from('planning_slot_services')
          .update({ slot_id: targetSlot.id })
          .eq('slot_id', slot_id);

        await supabaseAdmin
          .from('merchant_planning_slots')
          .delete()
          .eq('primary_slot_id', slot_id);

        newSlotId = targetSlot.id;
      } else {
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
        newSlotId = result.target_id || targetSlot.id;
      }
    }

    const oldDate = formatDate(slot.slot_date);
    const newDateFormatted = formatDate(new_date);

    // Fire-and-forget: push notification
    sendMerchantPush({
      supabase: supabaseAdmin,
      merchantId: merchant_id,
      notificationType: 'booking_rescheduled',
      referenceId: newSlotId,
      title: 'RDV deplace',
      body: `${slot.client_name} a deplace son RDV du ${oldDate} ${slot.start_time} au ${newDateFormatted} ${new_time}`,
      url: `/dashboard/planning?date=${new_date}`,
    }).catch(() => {});

    // Fire-and-forget: email notification
    (async () => {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
        if (authUser?.user?.email) {
          resend?.emails.send({
            from: EMAIL_FROM,
            headers: EMAIL_HEADERS,
            to: authUser.user.email,
            subject: `RDV modifie — ${slot.client_name}`,
            text: `${slot.client_name} a deplace son RDV du ${oldDate} a ${slot.start_time} au ${newDateFormatted} a ${new_time}.\n\nConnecte-toi sur ton dashboard pour voir tes reservations.\nhttps://getqarte.com/dashboard/planning`,
          }).catch(() => {});
        }
      } catch {
        // silent
      }
    })();

    return NextResponse.json({ success: true, new_slot_id: newSlotId });
  } catch (error) {
    logger.error('customer-edit PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
