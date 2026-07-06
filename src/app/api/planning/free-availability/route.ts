import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getTodayForCountry } from '@/lib/utils';
import { normalizeBookingMinLead, leadCutoffDate } from '@/lib/booking-window';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

/**
 * GET /api/planning/free-availability
 *
 * Pour le calendrier vitrine en mode libre : indique en 1 appel quels jours du range
 * ont au moins 1 creneau de duree N libre. Evite a la cliente de cliquer a l'aveugle
 * sur des jours blindes.
 *
 * Query : merchantId, from (YYYY-MM-DD), to (YYYY-MM-DD inclusif, max 62j), duration (min 1)
 * Response : { availability: { 'YYYY-MM-DD': boolean, ... } }
 *
 * Hors scope : home_service_enabled (depend des coords cliente, calcul impossible cote serveur).
 * Pour ces merchants on renvoie un objet vide -> le frontend skip l'affichage des dots.
 */

const querySchema = z.object({
  merchantId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.coerce.number().int().min(1).max(600),
});

const MAX_RANGE_DAYS = 62;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface DayHours {
  open: string;
  close: string;
  break_start?: string;
  break_end?: string;
}

/** Retourne true si au moins une fenetre libre >= duration existe ce jour. */
function hasAvailability(
  dayHours: DayHours,
  bookings: Array<{ start: number; end: number }>,
  duration: number,
  buffer: number,
): boolean {
  const openMins = timeToMinutes(dayHours.open);
  const closeMins = timeToMinutes(dayHours.close);
  if (openMins + duration > closeMins) return false;

  const breakStart = dayHours.break_start ? timeToMinutes(dayHours.break_start) : null;
  const breakEnd = dayHours.break_end ? timeToMinutes(dayHours.break_end) : null;

  // On scanne par pas de 15 min, comme free-slots, pour rester coherent.
  // Des qu'on trouve un slot valide on retourne true.
  const lastStart = closeMins - duration;
  for (let t = openMins; t <= lastStart; t += 15) {
    const candidateEnd = t + duration;
    if (breakStart !== null && breakEnd !== null && t < breakEnd && candidateEnd > breakStart) continue;
    const conflict = bookings.some(b => t < b.end && candidateEnd > b.start);
    if (!conflict) return true;
  }

  // Verifie aussi un dernier candidat 5-min apres chaque fin de booking (pattern tight de free-slots).
  for (const b of bookings) {
    const tight = Math.ceil((b.end + buffer) / 5) * 5;
    if (tight % 15 === 0) continue;
    if (tight < openMins || tight + duration > closeMins) continue;
    if (breakStart !== null && breakEnd !== null && tight < breakEnd && tight + duration > breakStart) continue;
    if (bookings.some(x => tight < x.end && tight + duration > x.start)) continue;
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(`free-availability:${ip}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      merchantId: searchParams.get('merchantId'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      duration: searchParams.get('duration'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }

    const { merchantId, from, to, duration } = parsed.data;
    if (from > to) {
      return NextResponse.json({ error: 'Range invalide' }, { status: 400 });
    }

    // Fetch merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, booking_mode, buffer_minutes, country, auto_booking_enabled, planning_enabled, opening_hours, home_service_enabled, booking_min_lead_hours')
      .eq('id', merchantId)
      .is('deleted_at', null)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    // Cet endpoint cible le mode libre. Pour mode slots les dispos sont deja chargees autrement.
    if (merchant.booking_mode !== 'free') {
      return NextResponse.json({ availability: {} });
    }

    // Home service : impossible de pre-calculer sans les coords cliente.
    if (merchant.home_service_enabled === true) {
      return NextResponse.json({ availability: {} });
    }

    if (!merchant.auto_booking_enabled || !merchant.planning_enabled) {
      return NextResponse.json({ availability: {} });
    }

    // Cap le range a today..today+MAX_RANGE_DAYS pour eviter abus. La borne basse
    // suit le délai minimum de réservation (mig 181) : les jours entièrement dans
    // la fenêtre ne renvoient pas de pastille. leadFloor === today quand délai = 0.
    const today = getTodayForCountry(merchant.country as MerchantCountry);
    const leadFloor = leadCutoffDate(normalizeBookingMinLead(merchant.booking_min_lead_hours), merchant.country as MerchantCountry);
    const effectiveFrom = from < leadFloor ? leadFloor : from;
    const cap = addDays(today, MAX_RANGE_DAYS);
    const effectiveTo = to > cap ? cap : to;
    if (effectiveFrom > effectiveTo) {
      return NextResponse.json({ availability: {} });
    }

    const buffer = merchant.buffer_minutes ?? 0;
    const openingHours = merchant.opening_hours as Record<string, DayHours | null> | null;

    // Fetch tous les bookings du range en 1 query
    const { data: bookedSlots } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('slot_date, start_time, total_duration_minutes')
      .eq('merchant_id', merchantId)
      .gte('slot_date', effectiveFrom)
      .lte('slot_date', effectiveTo)
      .not('client_name', 'is', null)
      .is('primary_slot_id', null);

    // Index par date
    const bookingsByDate = new Map<string, Array<{ start: number; end: number }>>();
    for (const s of bookedSlots || []) {
      const start = timeToMinutes(s.start_time);
      const dur = s.total_duration_minutes ?? 30;
      const arr = bookingsByDate.get(s.slot_date) || [];
      arr.push({ start, end: start + dur + buffer });
      bookingsByDate.set(s.slot_date, arr);
    }

    // Iterate jour par jour
    const availability: Record<string, boolean> = {};
    let cursor = effectiveFrom;
    while (cursor <= effectiveTo) {
      const dow = new Date(cursor + 'T12:00:00').getDay(); // 0=Sun … 6=Sat
      const key = dow === 0 ? '7' : String(dow);
      const dayHours = openingHours?.[key];

      if (!dayHours) {
        availability[cursor] = false;
      } else {
        const dayBookings = (bookingsByDate.get(cursor) || []).sort((a, b) => a.start - b.start);
        availability[cursor] = hasAvailability(dayHours, dayBookings, duration, buffer);
      }

      cursor = addDays(cursor, 1);
    }

    return NextResponse.json({ availability });
  } catch (error) {
    logger.error('Free availability error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
