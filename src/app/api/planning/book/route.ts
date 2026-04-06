import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { formatPhoneNumber, validatePhone, getTrialStatus, getTimezoneForCountry, getAllPhoneFormats } from '@/lib/utils';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { setPhoneCookie } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sendBookingNotificationEmail } from '@/lib/email';
import { sendMerchantPush } from '@/lib/merchant-push';
import { sendBookingSms } from '@/lib/sms';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

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
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Calcule la deadline d'acompte avec grace nuit silencieuse.
 * Si la deadline brute (now + deadlineHours) tombe entre 22h et 9h heure merchant,
 * elle est repoussee a 9h du matin pour ne pas forcer le merchant a confirmer en pleine nuit.
 * Cap absolu : RDV - 4h.
 */
function computeDepositDeadline(
  deadlineHours: number,
  rdvDateTime: Date,
  timezone: string
): Date | null {
  const now = new Date();

  let deadline = new Date(now.getTime() + deadlineHours * 3600_000);

  const deadlineInTz = toZonedTime(deadline, timezone);
  const hourInTz = deadlineInTz.getHours();
  if (hourInTz >= 22 || hourInTz < 9) {
    const next9am = new Date(deadlineInTz);
    if (hourInTz >= 22) next9am.setDate(next9am.getDate() + 1);
    next9am.setHours(9, 0, 0, 0);
    deadline = fromZonedTime(next9am, timezone);
  }

  const rdvMinus4h = new Date(rdvDateTime.getTime() - 4 * 3600_000);
  if (rdvMinus4h.getTime() <= now.getTime()) return null;

  return new Date(Math.min(deadline.getTime(), rdvMinus4h.getTime()));
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
      .select('id, user_id, shop_name, country, locale, stamps_required, loyalty_mode, auto_booking_enabled, planning_enabled, trial_ends_at, subscription_status, deposit_link, deposit_link_label, deposit_link_2, deposit_link_2_label, deposit_percent, deposit_amount, deposit_deadline_hours, welcome_offer_enabled, welcome_offer_description')
      .eq('id', merchant_id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    if (!merchant.auto_booking_enabled || !merchant.planning_enabled) {
      return NextResponse.json({ error: 'Réservation en ligne désactivée' }, { status: 403 });
    }

    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (trialStatus.isFullyExpired) {
      return NextResponse.json({ error: 'Ce commerce n\'accepte plus les réservations' }, { status: 403 });
    }

    // 2. Format & validate phone
    const country = (parsed.data.phone_country || merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number.trim(), country);
    if (!validatePhone(formattedPhone, country)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // 3-5. Fetch slot, services, and day slots in parallel
    const [{ data: targetSlot }, { data: services }, { data: daySlots }] = await Promise.all([
      supabaseAdmin
        .from('merchant_planning_slots')
        .select('id, slot_date, start_time, client_name')
        .eq('merchant_id', merchant_id)
        .eq('slot_date', slot_date)
        .eq('start_time', slot_time)
        .single(),
      supabaseAdmin
        .from('merchant_services')
        .select('id, name, price, duration')
        .eq('merchant_id', merchant_id)
        .in('id', service_ids),
      supabaseAdmin
        .from('merchant_planning_slots')
        .select('id, start_time, client_name')
        .eq('merchant_id', merchant_id)
        .eq('slot_date', slot_date)
        .order('start_time'),
    ]);

    if (!targetSlot) {
      return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 });
    }

    if (targetSlot.client_name !== null) {
      return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
    }

    if (!services || services.length === 0) {
      return NextResponse.json({ error: 'Prestations invalides' }, { status: 400 });
    }

    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 30), 0);
    const totalPrice = services.reduce((sum, s) => sum + Number(s.price || 0), 0);

    const startMins = timeToMinutes(targetSlot.start_time);
    const endMins = startMins + totalDuration;

    const slotsToBlock = (daySlots || []).filter(s => {
      const mins = timeToMinutes(s.start_time);
      return mins >= startMins && mins < endMins;
    });

    // Check all slots are available
    const unavailable = slotsToBlock.filter(s => s.client_name !== null);
    if (unavailable.length > 0) {
      return NextResponse.json({ error: 'Certains créneaux ne sont plus disponibles' }, { status: 409 });
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

    // 7. Block all slots atomically
    const slotIds = slotsToBlock.map(s => s.id);
    const fillerIds = slotIds.filter(id => id !== targetSlot.id);
    const hasDeposit = !!merchant.deposit_link;
    const baseData: Record<string, unknown> = {
      client_name: clientName,
      client_phone: formattedPhone,
      customer_id: customerId,
      booked_online: true,
      booked_at: new Date().toISOString(),
    };
    if (hasDeposit) {
      baseData.deposit_confirmed = false;

      // Compute deposit deadline with night grace period (22h-9h → pushed to 9am)
      const deadlineHours = merchant.deposit_deadline_hours;
      if (deadlineHours) {
        const tz = getTimezoneForCountry(merchant.country);
        const rdvTime = fromZonedTime(new Date(`${slot_date}T${targetSlot.start_time}:00`), tz);
        const deadline = computeDepositDeadline(deadlineHours, rdvTime, tz);
        if (deadline) baseData.deposit_deadline_at = deadline.toISOString();
      }
    }

    // Block primary slot
    const { error: primaryError } = await supabaseAdmin
      .from('merchant_planning_slots')
      .update(baseData)
      .eq('id', targetSlot.id)
      .is('client_name', null);

    if (primaryError) {
      logger.error('Booking block error (primary):', primaryError);
      return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 });
    }

    // Verify the primary slot was actually booked by us (check phone — unique per request)
    const { data: verifySlot } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('client_phone')
      .eq('id', targetSlot.id)
      .single();

    if (verifySlot?.client_phone !== formattedPhone) {
      return NextResponse.json({ error: 'Ce créneau n\'est plus disponible' }, { status: 409 });
    }

    // Block filler slots with primary_slot_id
    if (fillerIds.length > 0) {
      const { error: fillerError } = await supabaseAdmin
        .from('merchant_planning_slots')
        .update({ ...baseData, primary_slot_id: targetSlot.id })
        .in('id', fillerIds)
        .is('client_name', null);

      if (fillerError) {
        // Rollback primary slot
        await supabaseAdmin
          .from('merchant_planning_slots')
          .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null })
          .eq('id', targetSlot.id);
        logger.error('Booking block error (fillers):', fillerError);
        return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 });
      }
    }

    // 8. Add services to the primary slot
    if (service_ids.length > 0) {
      const rows = service_ids.map(sid => ({ slot_id: targetSlot.id, service_id: sid }));
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

    const deposit = links.length > 0 ? {
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
          date: targetSlot.slot_date,
          time: targetSlot.start_time,
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
      referenceId: targetSlot.id,
      title: 'Nouvelle réservation',
      body: `${clientName} — ${targetSlot.slot_date} à ${targetSlot.start_time}`,
      url: '/dashboard/planning',
      tag: 'qarte-merchant-booking',
    }).catch(() => {});

    // 10c. SMS confirmation to client (no deposit = send immediately)
    if (!hasDeposit) {
      sendBookingSms(supabaseAdmin, {
        merchantId: merchant_id,
        slotId: targetSlot.id,
        phone: formattedPhone,
        shopName: merchant.shop_name,
        date: targetSlot.slot_date,
        time: targetSlot.start_time,
        smsType: 'confirmation_no_deposit',
        locale: merchant.locale || 'fr',
        subscriptionStatus: merchant.subscription_status,
      }).catch(() => {});
    }

    // 11. Set phone cookie + return
    const jsonResponse = NextResponse.json({
      success: true,
      booking: {
        date: targetSlot.slot_date,
        time: targetSlot.start_time,
        services: serviceDetails,
        total_price: totalPrice,
        total_duration: totalDuration,
        slots_blocked: slotIds.length,
      },
      deposit,
    });

    setPhoneCookie(jsonResponse, formattedPhone);
    return jsonResponse;
  } catch (error) {
    logger.error('Booking error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
