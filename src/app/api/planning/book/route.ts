import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { formatPhoneNumber, validatePhone, getTrialStatus, getTimezoneForCountry, getAllPhoneFormats } from '@/lib/utils';
import { computeDepositDeadline } from '@/lib/deposit';
import { fromZonedTime } from 'date-fns-tz';
import { setPhoneCookie } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sendBookingNotificationEmail } from '@/lib/email';
import { sendMerchantPush } from '@/lib/merchant-push';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';
import { getPlanFeatures } from '@/lib/plan-tiers';

const supabaseAdmin = getSupabaseAdmin();

const bookSchema = z.object({
  merchant_id: z.string().uuid(),
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_time: z.string().regex(/^\d{2}:\d{2}$/),
  phone_number: z.string().min(4).max(20),
  phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  service_ids: z.array(z.string().uuid()).min(1).max(10),
  booking_mode: z.enum(['slots', 'free']).optional(),
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    const rl = checkRateLimit(`booking:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const body = await request.json();
    const parsed = bookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { merchant_id, slot_date, slot_time, phone_number, first_name, last_name, service_ids } = parsed.data;

    // 1. Fetch merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, country, locale, stamps_required, loyalty_mode, auto_booking_enabled, planning_enabled, trial_ends_at, subscription_status, plan_tier, deposit_link, deposit_link_label, deposit_link_2, deposit_link_2_label, deposit_percent, deposit_amount, deposit_deadline_hours, welcome_offer_enabled, welcome_offer_description, booking_mode, buffer_minutes')
      .eq('id', merchant_id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    if (!merchant.auto_booking_enabled || !merchant.planning_enabled) {
      return NextResponse.json({ error: 'Réservation en ligne désactivée' }, { status: 403 });
    }

    // Block online booking if merchant is on Fidélité tier (booking_online feature gated)
    if (!getPlanFeatures(merchant).bookingOnline) {
      return NextResponse.json({ error: 'Réservation en ligne indisponible' }, { status: 403 });
    }

    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (trialStatus.isTrialExpired) {
      return NextResponse.json({ error: 'Ce commerce n\'accepte plus les réservations' }, { status: 403 });
    }

    // 2. Format & validate phone
    const country = (parsed.data.phone_country || merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number.trim(), country);
    if (!validatePhone(formattedPhone, country)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    const isFreeMod = merchant.booking_mode === 'free';

    // 3-5. Fetch services + (mode créneaux: slot + day slots)
    const servicesPromise = supabaseAdmin
      .from('merchant_services')
      .select('id, name, price, duration')
      .eq('merchant_id', merchant_id)
      .in('id', service_ids);

    let targetSlot: { id: string; slot_date: string; start_time: string; client_name: string | null } | null = null;
    let daySlots: { id: string; start_time: string; client_name: string | null }[] | null = null;

    if (!isFreeMod) {
      const [slotResult, , slotsResult] = await Promise.all([
        supabaseAdmin
          .from('merchant_planning_slots')
          .select('id, slot_date, start_time, client_name')
          .eq('merchant_id', merchant_id)
          .eq('slot_date', slot_date)
          .eq('start_time', slot_time)
          .single(),
        servicesPromise,
        supabaseAdmin
          .from('merchant_planning_slots')
          .select('id, start_time, client_name')
          .eq('merchant_id', merchant_id)
          .eq('slot_date', slot_date)
          .order('start_time'),
      ]);
      targetSlot = slotResult.data ?? null;
      daySlots = slotsResult.data ?? null;
    }

    const { data: services } = await servicesPromise;

    if (!isFreeMod) {
      if (!targetSlot) {
        return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 });
      }
      if (targetSlot.client_name !== null) {
        return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
      }
    }

    if (!services || services.length === 0) {
      return NextResponse.json({ error: 'Prestations invalides' }, { status: 400 });
    }

    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 30), 0);
    const rawTotalPrice = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
    // Member discount applied after member lookup (section 6b) — use rawTotalPrice until then
    let totalPrice = rawTotalPrice;

    if (isFreeMod) {
      // Mode libre: re-check conflict (race condition guard)
      const { data: sameDayBooked } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('start_time, total_duration_minutes')
        .eq('merchant_id', merchant_id)
        .eq('slot_date', slot_date)
        .not('client_name', 'is', null)
        .is('primary_slot_id', null);

      const requestedStart = timeToMinutes(slot_time);
      const requestedEnd = requestedStart + totalDuration;
      const buffer = merchant.buffer_minutes ?? 0;

      const conflict = (sameDayBooked || []).some(s => {
        const sStart = timeToMinutes(s.start_time);
        const sEnd = sStart + (s.total_duration_minutes ?? 30) + buffer;
        return requestedStart < sEnd && requestedEnd > sStart;
      });

      if (conflict) {
        return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
      }
    } else {
      // Mode créneaux: check consecutive slots availability
      const startMins = timeToMinutes(slot_time);
      const endMins = startMins + totalDuration;

      const slotsToBlock = (daySlots || []).filter(s => {
        const mins = timeToMinutes(s.start_time);
        return mins >= startMins && mins < endMins;
      });

      const unavailable = slotsToBlock.filter(s => s.client_name !== null);
      if (unavailable.length > 0) {
        return NextResponse.json({ error: 'Certains créneaux ne sont plus disponibles' }, { status: 409 });
      }
    }

    // 6. Create or find customer
    const trimmedFirst = first_name.trim();
    const trimmedLast = last_name?.trim() || null;
    const clientName = trimmedLast ? `${trimmedFirst} ${trimmedLast}` : trimmedFirst;

    let customerId: string | null = null;

    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .in('phone_number', getAllPhoneFormats(formattedPhone))
      .eq('merchant_id', merchant_id)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create customer + loyalty card
      const { data: newCustomer } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone_number: formattedPhone,
          merchant_id: merchant_id,
        })
        .select('id')
        .single();

      if (newCustomer) {
        customerId = newCustomer.id;
        // Create loyalty card
        const { data: newCard } = await supabaseAdmin
          .from('loyalty_cards')
          .insert({
            customer_id: newCustomer.id,
            merchant_id: merchant_id,
            current_stamps: 0,
            current_amount: 0,
            stamps_target: merchant.stamps_required,
          })
          .select('id')
          .single();

        // Auto-create welcome voucher if enabled
        if (newCard && merchant.welcome_offer_enabled && merchant.welcome_offer_description) {
          await supabaseAdmin
            .from('vouchers')
            .insert({
              loyalty_card_id: newCard.id,
              merchant_id: merchant_id,
              customer_id: newCustomer.id,
              reward_description: merchant.welcome_offer_description,
              source: 'welcome',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
      }
    }

    // 6b. Check if customer is a loyal client (member card) for discount/deposit skip
    let memberDiscount: number | null = null;
    let memberSkipDeposit = false;
    if (customerId) {
      const { data: mc } = await supabaseAdmin
        .from('member_cards')
        .select('id, valid_until, program:member_programs!inner(discount_percent, skip_deposit, merchant_id)')
        .eq('customer_id', customerId)
        .eq('program.merchant_id', merchant_id)
        .gt('valid_until', new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (mc) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prog = mc.program as any;
        memberDiscount = prog?.discount_percent || null;
        memberSkipDeposit = prog?.skip_deposit || false;
      }
    }

    // Apply member discount to totalPrice
    if (memberDiscount) {
      totalPrice = Math.round(rawTotalPrice * (1 - memberDiscount / 100));
    }

    // 7. Create/block slot(s)
    const hasDeposit = !!merchant.deposit_link && !memberSkipDeposit;
    const bookedAt = new Date().toISOString();

    // Compute deposit deadline (shared between modes)
    let depositDeadlineAt: string | undefined;
    if (hasDeposit && merchant.deposit_deadline_hours) {
      const tz = getTimezoneForCountry(merchant.country);
      const rdvTime = fromZonedTime(new Date(`${slot_date}T${slot_time}:00`), tz);
      const deadline = computeDepositDeadline(merchant.deposit_deadline_hours, rdvTime, tz);
      if (deadline) depositDeadlineAt = deadline.toISOString();
    }

    let bookedSlotId: string;
    let slotsBlocked = 1;

    if (isFreeMod) {
      // Mode libre: INSERT one slot (no filler slots)
      const insertData: Record<string, unknown> = {
        merchant_id,
        slot_date,
        start_time: slot_time,
        client_name: clientName,
        client_phone: formattedPhone,
        customer_id: customerId,
        total_duration_minutes: totalDuration,
        booked_online: true,
        booked_at: bookedAt,
      };
      if (hasDeposit) {
        insertData.deposit_confirmed = false;
        if (depositDeadlineAt) insertData.deposit_deadline_at = depositDeadlineAt;
      }

      const { data: newSlot, error: insertError } = await supabaseAdmin
        .from('merchant_planning_slots')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError || !newSlot) {
        logger.error('Booking insert error (free mode):', insertError);
        return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 });
      }
      bookedSlotId = newSlot.id;
    } else {
      // Mode créneaux: UPDATE existing pre-generated slots
      // Rebuild slotsToBlock from daySlots (computed earlier in the validation branch)
      const startMins = timeToMinutes(slot_time);
      const endMins = startMins + totalDuration;
      const slotsToBlock = (daySlots || []).filter(s => {
        const mins = timeToMinutes(s.start_time);
        return mins >= startMins && mins < endMins;
      });

      const slotIds = slotsToBlock.map(s => s.id);
      const fillerIds = slotIds.filter(id => id !== targetSlot!.id);
      slotsBlocked = slotIds.length;

      const baseData: Record<string, unknown> = {
        client_name: clientName,
        client_phone: formattedPhone,
        customer_id: customerId,
        booked_online: true,
        booked_at: bookedAt,
      };
      if (hasDeposit) {
        baseData.deposit_confirmed = false;
        if (depositDeadlineAt) baseData.deposit_deadline_at = depositDeadlineAt;
      }

      // Block primary slot
      const { error: primaryError } = await supabaseAdmin
        .from('merchant_planning_slots')
        .update(baseData)
        .eq('id', targetSlot!.id)
        .is('client_name', null);

      if (primaryError) {
        logger.error('Booking block error (primary):', primaryError);
        return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 });
      }

      // Verify the primary slot was actually booked by us (race condition guard)
      const { data: verifySlot } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('client_phone')
        .eq('id', targetSlot!.id)
        .single();

      if (verifySlot?.client_phone !== formattedPhone) {
        return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
      }

      // Block filler slots with primary_slot_id
      if (fillerIds.length > 0) {
        const { error: fillerError } = await supabaseAdmin
          .from('merchant_planning_slots')
          .update({ ...baseData, primary_slot_id: targetSlot!.id })
          .in('id', fillerIds)
          .is('client_name', null);

        if (fillerError) {
          // Rollback primary slot
          await supabaseAdmin
            .from('merchant_planning_slots')
            .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null })
            .eq('id', targetSlot!.id);
          logger.error('Booking block error (fillers):', fillerError);
          return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 });
        }
      }

      bookedSlotId = targetSlot!.id;
    }

    // 8. Add services to the booked slot
    if (service_ids.length > 0) {
      const rows = service_ids.map(sid => ({ slot_id: bookedSlotId, service_id: sid }));
      await supabaseAdmin.from('planning_slot_services').insert(rows);
    }

    // 9. Build response
    const serviceDetails = services.map(s => ({
      name: s.name,
      price: Number(s.price || 0),
      duration: s.duration || 30,
    }));

    const depositAmount = merchant.deposit_amount
      ? Number(merchant.deposit_amount)
      : merchant.deposit_percent
        ? Math.round(totalPrice * merchant.deposit_percent / 100)
        : null;

    const normalizeLink = (url: string | null) =>
      url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;

    const links: Array<{ label: string | null; url: string }> = [];
    const link1 = normalizeLink(merchant.deposit_link);
    if (link1) links.push({ label: merchant.deposit_link_label || null, url: link1 });
    const link2 = normalizeLink(merchant.deposit_link_2);
    if (link2) links.push({ label: merchant.deposit_link_2_label || null, url: link2 });

    const deposit = links.length > 0 && hasDeposit ? {
      link: links[0].url, // retro-compat
      links,
      percent: merchant.deposit_percent || null,
      fixed_amount: merchant.deposit_amount ? Number(merchant.deposit_amount) : null,
      amount: depositAmount,
      deadline_hours: merchant.deposit_deadline_hours || null,
    } : null;

    // 10. Send email notification to merchant (fire-and-forget)
    const { data: merchantUser } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
    if (merchantUser?.user?.email) {
      sendBookingNotificationEmail(
        merchantUser.user.email,
        {
          shopName: merchant.shop_name,
          clientName,
          clientPhone: formattedPhone,
          date: slot_date,
          time: slot_time,
          services: serviceDetails,
          totalDuration,
          totalPrice,
          deposit,
          locale: merchant.locale || 'fr',
        }
      ).catch(err => logger.error('Booking notification email failed:', err));
    }

    // 10b. Push notification to merchant (fire-and-forget)
    sendMerchantPush({
      supabase: supabaseAdmin,
      merchantId: merchant_id,
      notificationType: 'booking',
      referenceId: bookedSlotId,
      title: 'Nouvelle réservation',
      body: `${clientName} — ${slot_date} à ${slot_time}`,
      url: `/dashboard/planning?date=${slot_date}`,
      tag: 'qarte-merchant-booking',
    }).catch(() => {});

    // 10c. SMS confirmation to client — only for deposit bookings (sent after merchant validates)
    // No-deposit bookings: client sees confirmation in BookingModal + gets J-1 reminder SMS

    // 11. Set phone cookie + return
    const jsonResponse = NextResponse.json({
      success: true,
      booking: {
        date: slot_date,
        time: slot_time,
        services: serviceDetails,
        total_price: totalPrice,
        total_duration: totalDuration,
        slots_blocked: slotsBlocked,
      },
      deposit,
      member_benefit: memberDiscount || memberSkipDeposit ? {
        discount_percent: memberDiscount,
        original_price: rawTotalPrice,
        skip_deposit: memberSkipDeposit,
      } : null,
    });

    setPhoneCookie(jsonResponse, formattedPhone);
    return jsonResponse;
  } catch (error) {
    logger.error('Booking error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
