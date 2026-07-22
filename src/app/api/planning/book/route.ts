import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { formatPhoneNumber, validatePhone, getTimezoneForCountry, getTodayForCountry, getAllPhoneFormats, getAppUrl, getCurrencyForCountry, truncate } from '@/lib/utils';
import { normalizeBookingHorizon, isSlotInPast, isSlotBeforeLeadTime, normalizeBookingMinLead } from '@/lib/booking-window';
import { projectBookingLoyalty, type BookingLoyaltyPreview } from '@/lib/booking-loyalty';
import { isMerchantBlocked } from '@/lib/merchant-access';
import type { EmailLocale } from '@/emails/translations';
import { computeDepositDeadline, computeDepositAmount } from '@/lib/deposit';
import { fromZonedTime } from 'date-fns-tz';
import { setPhoneCookie } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sendBookingNotificationEmail, sendBookingConfirmationEmail } from '@/lib/email';
import { sendMerchantPush } from '@/lib/merchant-push';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';
import { getPlanFeatures } from '@/lib/plan-tiers';
import { getTravelTime, haversineKm, type Coords } from '@/lib/travel-time';
import { recomputeDayTravel } from '@/lib/travel-recompute';
import { buildDepositLinks } from '@/lib/payment-providers';
import { computeBookingPrice } from '@/lib/booking-pricing';
import { customerAddressFields } from '@/lib/customer-address';
import { reserveAndEnrich } from '@/lib/booking-reserve';

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
  customer_address: z.string().min(3).max(300).optional(),
  customer_lat: z.number().min(-90).max(90).optional(),
  customer_lng: z.number().min(-180).max(180).optional(),
  customer_email: z.string().email().max(254).optional(),
  customer_message: z.string().max(500).optional(),
  // RDV de suivi récurrent (+3/+6 sem.) : acompte différé (rappel J-7), pas d'envoi
  // cliente immédiat, bypass de l'horizon de réservation. Cf. mig 177.
  followup: z.boolean().optional(),
});

// Cap de sécurité pour les RDV de suivi (bypass de booking_horizon_days).
const FOLLOWUP_MAX_DAYS = 120;

const MAX_TRAVEL_MINUTES = 60;

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

    const { merchant_id, slot_date, slot_time, phone_number, first_name, last_name, service_ids, customer_address, customer_lat, customer_lng, customer_email, customer_message } = parsed.data;
    const isFollowup = parsed.data.followup === true;
    const trimmedEmail = customer_email?.trim().toLowerCase() || null;
    const trimmedMessage = customer_message?.trim() || null;

    // 1. Fetch merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, country, locale, stamps_required, loyalty_mode, booking_earns_loyalty, reward_description, auto_booking_enabled, planning_enabled, trial_ends_at, subscription_status, past_due_since, plan_tier, deposit_link, deposit_link_label, deposit_link_2, deposit_link_2_label, deposit_percent, deposit_amount, deposit_deadline_hours, deposit_only_for_new_customers, welcome_offer_enabled, welcome_offer_description, welcome_offer_discount_percent, booking_mode, buffer_minutes, booking_horizon_days, booking_min_lead_hours, home_service_enabled, home_service_radius_km, shop_lat, shop_lng, allow_customer_cancel, cancel_deadline_days, allow_customer_reschedule, reschedule_deadline_days, recurring_followup_enabled, booking_reminder_details, booking_reminder_in_confirmation')
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

    // Bloque si trial expired (>3j grace) OU past_due >72h (mig 164).
    if (isMerchantBlocked({
      trial_ends_at: merchant.trial_ends_at,
      subscription_status: merchant.subscription_status,
      past_due_since: merchant.past_due_since,
    })) {
      return NextResponse.json({ error: 'Ce commerce n\'accepte plus les réservations' }, { status: 403 });
    }

    // Garde RDV de suivi : nécessite l'option activée (anti-spoof).
    if (isFollowup && !merchant.recurring_followup_enabled) {
      return NextResponse.json({ error: 'RDV de suivi indisponible' }, { status: 403 });
    }

    // Garde horizon : refuse une résa au-delà de la fenêtre réglée par le merchant
    // (mig 168). Le maxDate du calendrier client borne déjà l'UI, ce check est
    // la défense serveur anti-spoof. Les RDV de suivi (cadence voulue par le merchant)
    // bypassent l'horizon mais restent cappés à FOLLOWUP_MAX_DAYS.
    {
      const horizonStart = getTodayForCountry(merchant.country);
      const horizonEnd = new Date(horizonStart);
      horizonEnd.setDate(horizonEnd.getDate() + (isFollowup ? FOLLOWUP_MAX_DAYS : normalizeBookingHorizon(merchant.booking_horizon_days)));
      if (slot_date < horizonStart || slot_date > horizonEnd.toISOString().split('T')[0]) {
        return NextResponse.json({ error: 'Ce créneau n\'est plus réservable' }, { status: 400 });
      }
    }

    // Garde anti-rétroactif : refuse une résa cliente sur un créneau déjà passé
    // (cliente avec horloge décalée, UI buggée, requête forgée). Le manual-booking
    // dashboard n'est PAS gardé ici — un merchant peut légitimement backdater.
    if (isSlotInPast(slot_date, slot_time, merchant.country)) {
      return NextResponse.json({ error: 'slot_in_past' }, { status: 400 });
    }

    // Garde délai minimum : refuse une résa cliente trop proche (anti dernière
    // minute, mig 181). Borne basse, miroir de l'horizon. Skip pour les RDV de
    // suivi (cadence merchant, toujours loin) ; non appliqué au manual-booking
    // dashboard (comme le past-guard, le merchant peut caler du dernière minute).
    if (!isFollowup && isSlotBeforeLeadTime(slot_date, slot_time, normalizeBookingMinLead(merchant.booking_min_lead_hours), merchant.country)) {
      return NextResponse.json({ error: 'slot_before_lead_time' }, { status: 400 });
    }

    // 2. Format & validate phone
    const country = (parsed.data.phone_country || merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number.trim(), country);
    if (!validatePhone(formattedPhone, country)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // 2b. Banned numbers — bloque le numero banni par le merchant (cohérent avec /api/checkin)
    const phoneVariants = getAllPhoneFormats(formattedPhone);
    const { data: bannedRow } = await supabaseAdmin
      .from('banned_numbers')
      .select('id')
      .in('phone_number', phoneVariants)
      .eq('merchant_id', merchant.id)
      .maybeSingle();
    if (bannedRow) {
      return NextResponse.json({ error: 'Ce numéro ne peut pas réserver ici. Contactez directement le salon.' }, { status: 403 });
    }

    const isFreeMod = merchant.booking_mode === 'free';
    const homeService = merchant.home_service_enabled === true;

    // Home service: customer address + coords required (online booking only — manual bookings go through /api/planning/manual-booking)
    if (homeService) {
      if (!customer_address || customer_lat == null || customer_lng == null) {
        return NextResponse.json({ error: 'Adresse cliente requise pour ce salon à domicile' }, { status: 400 });
      }
      if (merchant.shop_lat == null || merchant.shop_lng == null) {
        return NextResponse.json({ error: 'Le salon n\'a pas configuré son adresse de départ' }, { status: 400 });
      }
      // Garde rayon d'intervention — défense serveur (la vitrine bloque déjà côté UI)
      if (merchant.home_service_radius_km
          && haversineKm(
            { lat: merchant.shop_lat, lng: merchant.shop_lng },
            { lat: customer_lat, lng: customer_lng },
          ) > merchant.home_service_radius_km) {
        return NextResponse.json(
          { error: 'out_of_zone', radius_km: merchant.home_service_radius_km },
          { status: 400 },
        );
      }
    }

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

    let travelTimeIn: number | null = null;

    if (isFreeMod) {
      // Mode libre: re-check conflict (race condition guard)
      const { data: sameDayBooked } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('id, start_time, total_duration_minutes, customer_lat, customer_lng')
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

      // Home service: recheck travel-time gaps (anti-race) + compute travelTimeIn for storage
      if (homeService && customer_lat != null && customer_lng != null && merchant.shop_lat != null && merchant.shop_lng != null) {
        const customerCoords: Coords = { lat: customer_lat, lng: customer_lng };
        const shopCoords: Coords = { lat: merchant.shop_lat, lng: merchant.shop_lng };

        // Buffer (aléa) inclus dans .end pour cohérence avec free-slots route.
        const dayBookings = (sameDayBooked || [])
          .map(s => ({
            id: s.id,
            start: timeToMinutes(s.start_time),
            end: timeToMinutes(s.start_time) + (s.total_duration_minutes ?? 30) + buffer,
            coords: s.customer_lat != null && s.customer_lng != null
              ? ({ lat: s.customer_lat, lng: s.customer_lng } as Coords)
              : null,
          }))
          .sort((a, b) => a.start - b.start);

        const prev = [...dayBookings].reverse().find(b => b.end <= requestedStart);
        const next = dayBookings.find(b => b.start >= requestedEnd);

        const prevCoords = prev?.coords ?? shopCoords;
        const [travelInResult, travelOutResult] = await Promise.all([
          getTravelTime(prevCoords, customerCoords),
          next?.coords ? getTravelTime(customerCoords, next.coords) : Promise.resolve<number | null>(null),
        ]);
        travelTimeIn = travelInResult;

        if (travelTimeIn > MAX_TRAVEL_MINUTES || requestedStart - travelTimeIn < (prev?.end ?? 0)) {
          return NextResponse.json({ error: 'Trajet trop long depuis le RDV précédent' }, { status: 409 });
        }

        if (next?.coords && travelOutResult != null) {
          // Buffer appliqué symétriquement : duration + buffer + travelOut ≤ next.start
          if (travelOutResult > MAX_TRAVEL_MINUTES || requestedEnd + buffer + travelOutResult > next.start) {
            return NextResponse.json({ error: 'Pas assez de temps pour rejoindre le RDV suivant' }, { status: 409 });
          }
        }
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
      .select('id, email')
      .in('phone_number', getAllPhoneFormats(formattedPhone))
      .eq('merchant_id', merchant_id)
      .maybeSingle();

    const isNewCustomer = !existingCustomer;

    // Home service (mig 174) : persiste l'adresse sur la fiche customer pour
    // pre-remplir au prochain RDV. Seul ce mode ecrit ces 3 colonnes.
    const addrFields = homeService
      ? customerAddressFields(customer_address, customer_lat, customer_lng)
      : null;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Merge email + address upsert en 1 seul UPDATE (defense fenetre serveur).
      const updateFields: Record<string, unknown> = {};
      if (trimmedEmail && trimmedEmail !== existingCustomer.email) updateFields.email = trimmedEmail;
      if (addrFields) Object.assign(updateFields, addrFields);
      if (Object.keys(updateFields).length > 0) {
        await supabaseAdmin
          .from('customers')
          .update(updateFields)
          .eq('id', existingCustomer.id);
      }
    } else {
      // Create customer + loyalty card
      const { data: newCustomer } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone_number: formattedPhone,
          merchant_id: merchant_id,
          email: trimmedEmail,
          ...(addrFields ?? {}),
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

        // Pas de voucher welcome ici : ce code ne tourne que pour les merchants
        // auto_booking_enabled (vitrine), donc la reduction welcome est appliquee
        // directement au booking via welcome_offer_discount_percent. Si le merchant
        // n'a pas configure de %, son offre n'a aucun effet — un warning UI dans
        // /dashboard/public-page le pousse a saisir le %.
      }
    }

    // 6b. Check if customer is a loyal client (member card) for discount/deposit skip
    // + fetch active promo offer in parallel
    let memberDiscount: number | null = null;
    let memberSkipDeposit = false;
    const [memberRes, activeOfferRes] = await Promise.all([
      customerId
        ? supabaseAdmin
            .from('member_cards')
            .select('id, valid_until, program:member_programs!inner(discount_percent, skip_deposit, merchant_id)')
            .eq('customer_id', customerId)
            .eq('program.merchant_id', merchant_id)
            .gt('valid_until', new Date().toISOString())
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from('merchant_offers')
        .select('id, discount_percent, target_service_ids')
        .eq('merchant_id', merchant_id)
        .eq('active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (memberRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prog = (memberRes.data as any).program;
      memberDiscount = prog?.discount_percent || null;
      memberSkipDeposit = prog?.skip_deposit || false;
    }

    const activeOffer = activeOfferRes.data as { id: string; discount_percent: number | null; target_service_ids: string[] | null } | null;
    const promoPercent = activeOffer?.discount_percent ?? null;
    const promoTargetServiceIds = activeOffer?.target_service_ids ?? null;
    const welcomePercent = (isNewCustomer && merchant.welcome_offer_enabled && merchant.welcome_offer_discount_percent)
      ? merchant.welcome_offer_discount_percent
      : null;

    // Apply discounts (member × welcome × promo) via single source of truth.
    // Mig 157 : promo peut être ciblée sur certaines prestations seulement.
    const serviceLines = services.map((s) => ({ id: s.id, price: Number(s.price || 0) }));
    const priceResult = computeBookingPrice({
      serviceLines,
      memberPercent: memberDiscount,
      welcomePercent,
      promoPercent,
      promoTargetServiceIds,
    });
    totalPrice = priceResult.finalPrice;

    // 7. Create/block slot(s)
    // Mig 165 : skip si toggle ON et profil `customers` existe deja pour ce merchant
    // (= le merchant connait la cliente, soit elle a deja reserve soit elle a ete
    // ajoutee a la main comme walk-in via ClientSelectModal). Meme semantique
    // "isNewCustomer" que la welcome offer ligne 352.
    const skipForReturning = merchant.deposit_only_for_new_customers && !isNewCustomer;
    const hasDeposit = !!merchant.deposit_link && !memberSkipDeposit && !skipForReturning;
    const bookedAt = new Date().toISOString();

    // RDV de suivi : acompte différé (rappel J-7), pas de deadline au booking — elle
    // sera posée au J-7 par le cron de rappel (= RDV − cancel_deadline_days). Tant que
    // deposit_deadline_at est NULL, le cron deposit-expiration ne libère pas le slot.
    const deferDeposit = isFollowup && hasDeposit;

    // Compute deposit deadline (shared between modes) — sauf RDV de suivi (différé).
    let depositDeadlineAt: string | undefined;
    if (hasDeposit && !deferDeposit && merchant.deposit_deadline_hours) {
      const tz = getTimezoneForCountry(merchant.country);
      const rdvTime = fromZonedTime(new Date(`${slot_date}T${slot_time}:00`), tz);
      const deadline = computeDepositDeadline(merchant.deposit_deadline_hours, rdvTime, tz);
      if (deadline) depositDeadlineAt = deadline.toISOString();
    }

    let bookedSlotId: string;
    let slotsBlocked = 1;

    // Snapshots des % appliqués pour historique fidèle (mig 153 + mig 157 amount)
    const appliedDiscountFields: Record<string, unknown> = {};
    // Snapshot uniquement l'offre qui a "gagne" la comparaison (computeBookingPrice
    // applique une seule offre, la plus rentable en EUR — pas de cumul).
    if (priceResult.appliedDiscounts.promo && activeOffer && priceResult.appliedDiscounts.promoAmount) {
      appliedDiscountFields.applied_offer_id = activeOffer.id;
      appliedDiscountFields.applied_offer_percent = priceResult.appliedDiscounts.promo;
      appliedDiscountFields.applied_offer_amount = priceResult.appliedDiscounts.promoAmount;
    }
    if (priceResult.appliedDiscounts.welcome) {
      appliedDiscountFields.applied_welcome_percent = priceResult.appliedDiscounts.welcome;
    }
    // Snapshot du prix final réduit (member + welcome/promo) — source unique du prix payé,
    // lue par les emails acompte + les stats CA sans recalcul depuis le brut (mig 176).
    appliedDiscountFields.total_price = priceResult.finalPrice;

    if (isFreeMod) {
      // Mode libre: réservation atomique (lock merchant+jour) puis enrichissement.
      const insertData: Record<string, unknown> = {
        merchant_id,
        slot_date,
        start_time: slot_time,
        client_name: clientName,
        client_phone: formattedPhone,
        customer_id: customerId,
        customer_email: trimmedEmail,
        customer_message: trimmedMessage,
        total_duration_minutes: totalDuration,
        booked_online: true,
        booked_at: bookedAt,
        ...appliedDiscountFields,
      };
      if (hasDeposit) {
        insertData.deposit_confirmed = false;
        if (deferDeposit) insertData.deposit_deferred = true;
        if (depositDeadlineAt) insertData.deposit_deadline_at = depositDeadlineAt;
      }
      if (homeService && customer_address) {
        insertData.customer_address = customer_address;
        insertData.customer_lat = customer_lat;
        insertData.customer_lng = customer_lng;
        insertData.travel_time_minutes = travelTimeIn;
      }

      const reserved = await reserveAndEnrich(
        supabaseAdmin,
        { merchantId: merchant_id, slotDate: slot_date, startTime: slot_time, durationMinutes: totalDuration, bufferMinutes: merchant.buffer_minutes ?? 0, clientName },
        insertData,
        { conflict: 'Ce créneau n\'est plus disponible', error: 'Erreur lors de la réservation' },
      );
      if (!reserved.ok) return reserved.response;
      bookedSlotId = reserved.slotId;
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
        customer_email: trimmedEmail,
        customer_message: trimmedMessage,
        booked_online: true,
        booked_at: bookedAt,
        ...appliedDiscountFields,
      };
      if (hasDeposit) {
        baseData.deposit_confirmed = false;
        if (deferDeposit) baseData.deposit_deferred = true;
        if (depositDeadlineAt) baseData.deposit_deadline_at = depositDeadlineAt;
      }

      // Block primary slot — stocke aussi total_duration_minutes pour que les
      // checks de conflit ulterieurs (notamment apres un switch slots->libre)
      // sachent combien de temps le RDV dure vraiment, au lieu de retomber sur
      // un default 30 min qui laisserait passer des chevauchements.
      const { error: primaryError } = await supabaseAdmin
        .from('merchant_planning_slots')
        .update({ ...baseData, total_duration_minutes: totalDuration })
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

    // 8b. Home service: a new booking shifts the predecessor of any later booking on
    // the same day, so all later slots' travel_time_in may need recompute. Skip overrides.
    if (homeService && isFreeMod && customer_lat != null && customer_lng != null) {
      try {
        await recomputeDayTravel(merchant_id, slot_date);
      } catch (err) {
        logger.warn('recomputeDayTravel after booking failed', { err: String(err) });
      }
    }

    // 9. Build response
    const serviceDetails = services.map(s => ({
      name: s.name,
      price: Number(s.price || 0),
      duration: s.duration || 30,
    }));

    // Plafonné au prix de la prestation : un acompte fixe > total (ex: acompte 20€,
    // presta 14€) ne doit pas demander plus que le service ni afficher un reste négatif.
    const depositAmount = computeDepositAmount(
      totalPrice,
      merchant.deposit_amount ? Number(merchant.deposit_amount) : null,
      merchant.deposit_percent ? Number(merchant.deposit_percent) : null,
    );

    const links = buildDepositLinks(
      merchant.deposit_link,
      merchant.deposit_link_label,
      merchant.deposit_link_2,
      merchant.deposit_link_2_label,
    );

    const deposit = links.length > 0 && hasDeposit ? {
      link: links[0].url, // retro-compat
      links,
      percent: merchant.deposit_percent || null,
      fixed_amount: merchant.deposit_amount ? Number(merchant.deposit_amount) : null,
      amount: depositAmount,
      deadline_hours: merchant.deposit_deadline_hours || null,
    } : null;

    // 10. Send email notification to merchant (fire-and-forget)
    // RDV de suivi : pas d'email merchant (évite 3 mails d'un coup) — le merchant
    // voit le RDV en agenda + reçoit une push.
    const { data: merchantUser } = isFollowup ? { data: null } : await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
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
          customerAddress: homeService ? customer_address ?? null : null,
          travelTimeMinutes: homeService ? travelTimeIn : null,
          customerMessage: trimmedMessage,
        }
      ).catch(err => logger.error('Booking notification email failed:', err));
    }

    // 10a-bis. Send confirmation email to client (fire-and-forget) — only if email provided.
    // RDV de suivi : pas d'email cliente immédiat (rien à payer maintenant) — elle voit le
    // récap à l'écran + sur sa carte ; l'email/SMS d'acompte partira 7 jours avant (cron J-7).
    if (trimmedEmail && !isFollowup) {
      const merchantCurrency = getCurrencyForCountry(merchant.country) as 'EUR' | 'CHF';
      sendBookingConfirmationEmail(trimmedEmail, {
        shopName: merchant.shop_name,
        clientFirstName: trimmedFirst,
        date: slot_date,
        time: slot_time,
        services: serviceDetails,
        totalDuration,
        totalPrice,
        currency: merchantCurrency,
        customerAddress: homeService ? customer_address ?? null : null,
        mode: deposit ? 'pending_deposit' : 'confirmed',
        deposit: deposit ? {
          amount: deposit.amount,
          percent: deposit.percent,
          deadlineHours: deposit.deadline_hours,
          links: deposit.links,
        } : null,
        loyaltyCardUrl: `${getAppUrl()}/customer/card/${merchant.id}`,
        cancelPolicyDays: merchant.allow_customer_cancel ? (merchant.cancel_deadline_days ?? 1) : null,
        reschedulePolicyDays: merchant.allow_customer_reschedule ? (merchant.reschedule_deadline_days ?? 1) : null,
        practicalDetails: merchant.booking_reminder_in_confirmation ? (merchant.booking_reminder_details || null) : null,
        locale: (merchant.locale as EmailLocale) || 'fr',
      }).catch(err => logger.error('Booking confirmation email (client) failed:', err));
    }

    // 10b. Push notification to merchant (fire-and-forget)
    // Home service: enrich body with address + travel time + recommended departure
    let pushBody = `${clientName} — ${slot_date} à ${slot_time}`;
    if (homeService && customer_address) {
      pushBody += `\n📍 ${customer_address}`;
      if (travelTimeIn != null && travelTimeIn > 0) {
        const startMins = timeToMinutes(slot_time);
        const departMins = Math.max(0, startMins - travelTimeIn);
        const departHH = String(Math.floor(departMins / 60)).padStart(2, '0');
        const departMM = String(departMins % 60).padStart(2, '0');
        pushBody += `\n🚗 ${travelTimeIn} min trajet · départ conseillé ${departHH}:${departMM}`;
      }
    }
    if (trimmedMessage) {
      pushBody += `\n💬 ${truncate(trimmedMessage, 80)}`;
    }

    sendMerchantPush({
      supabase: supabaseAdmin,
      merchantId: merchant_id,
      notificationType: 'booking',
      referenceId: bookedSlotId,
      title: isFollowup ? 'RDV de suivi réservé' : 'Nouvelle réservation',
      body: pushBody,
      url: `/dashboard/planning?date=${slot_date}`,
      tag: 'qarte-merchant-booking',
    }).catch((err) => logger.error('Booking merchant push failed', err));

    // 10c. SMS confirmation to client — only for deposit bookings (sent after merchant validates)
    // No-deposit bookings: client sees confirmation in BookingModal + gets J-1 reminder SMS

    // 10d. Bloc fidélité pour l'écran de confirmation (résa en ligne honorée = 1 point / +montant).
    // Projection prête à afficher, formulation client au futur (le point suit la venue). Skip pour
    // les RDV de suivi (plusieurs créneaux) et si l'option merchant est OFF. Nouvelle cliente : la
    // carte vient d'être créée à 0 (cf. plus haut), inutile de la relire.
    let loyalty: BookingLoyaltyPreview | null = null;
    if (merchant.booking_earns_loyalty && customerId && !isFollowup) {
      let current = 0;
      if (!isNewCustomer) {
        const { data: card } = await supabaseAdmin
          .from('loyalty_cards')
          .select('current_stamps')
          .eq('customer_id', customerId)
          .eq('merchant_id', merchant_id)
          .maybeSingle();
        current = Number(card?.current_stamps || 0);
      }
      loyalty = projectBookingLoyalty(merchant.loyalty_mode, current, Number(merchant.stamps_required || 0), merchant.reward_description, totalPrice);
    }

    // 11. Set phone cookie + return
    const jsonResponse = NextResponse.json({
      success: true,
      booking: {
        slot_id: bookedSlotId,
        date: slot_date,
        time: slot_time,
        services: serviceDetails,
        total_price: totalPrice,
        total_duration: totalDuration,
        slots_blocked: slotsBlocked,
        is_new_customer: isNewCustomer,
        loyalty,
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
