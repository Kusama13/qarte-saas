import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getTodayForCountry } from '@/lib/utils';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';
import { getTravelTime, type Coords } from '@/lib/travel-time';

const supabaseAdmin = getSupabaseAdmin();

const MAX_TRAVEL_MINUTES = 60;

const querySchema = z.object({
  merchantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalDuration: z.coerce.number().int().min(1).max(600),
  customerLat: z.coerce.number().min(-90).max(90).optional(),
  customerLng: z.coerce.number().min(-180).max(180).optional(),
});

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * GET /api/planning/free-slots
 * Computes available start times for mode libre bookings.
 * Uses merchant.opening_hours (keys "1"=Mon…"7"=Sun, value { open, close } | null).
 * ?merchantId=<uuid>&date=<YYYY-MM-DD>&totalDuration=<minutes>
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(`free-slots:${ip}`, { maxRequests: 60, windowMs: 60_000 });
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      merchantId: searchParams.get('merchantId'),
      date: searchParams.get('date'),
      totalDuration: searchParams.get('totalDuration'),
      customerLat: searchParams.get('customerLat') ?? undefined,
      customerLng: searchParams.get('customerLng') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const { merchantId, date, totalDuration, customerLat, customerLng } = parsed.data;

    // 1. Fetch merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, booking_mode, buffer_minutes, country, auto_booking_enabled, planning_enabled, opening_hours, home_service_enabled, shop_lat, shop_lng')
      .eq('id', merchantId)
      .is('deleted_at', null)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    if (merchant.booking_mode !== 'free') {
      return NextResponse.json({ error: 'Mode non applicable' }, { status: 400 });
    }

    if (!merchant.auto_booking_enabled || !merchant.planning_enabled) {
      return NextResponse.json({ slots: [] });
    }

    // 2. Validate date is not in the past
    const today = getTodayForCountry(merchant.country as MerchantCountry);
    if (date < today) {
      return NextResponse.json({ slots: [] });
    }

    // 3. Resolve opening hours for the requested day
    // opening_hours keys: "1"=Lundi … "6"=Samedi, "7"=Dimanche (matches date.getDay() except Sunday)
    const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0=Sun, 1=Mon … 6=Sat
    const key = dayOfWeek === 0 ? '7' : String(dayOfWeek);
    const openingHours = merchant.opening_hours as Record<string, { open: string; close: string; break_start?: string; break_end?: string } | null> | null;
    const dayHours = openingHours?.[key];

    if (!dayHours) {
      // null or missing = closed that day
      return NextResponse.json({ slots: [] });
    }

    const buffer = merchant.buffer_minutes ?? 0;
    const openMins = timeToMinutes(dayHours.open);
    const closeMins = timeToMinutes(dayHours.close);
    const breakStart = dayHours.break_start ? timeToMinutes(dayHours.break_start) : null;
    const breakEnd = dayHours.break_end ? timeToMinutes(dayHours.break_end) : null;

    // No room for even one booking
    if (openMins + totalDuration > closeMins) {
      return NextResponse.json({ slots: [] });
    }

    // 4. Fetch existing booked slots for this day (primary slots only, no filler)
    const { data: bookedSlots } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('start_time, total_duration_minutes, customer_lat, customer_lng')
      .eq('merchant_id', merchantId)
      .eq('slot_date', date)
      .not('client_name', 'is', null)
      .is('primary_slot_id', null);

    // Build occupied ranges: [startMins, endMins) inclusive of buffer after
    type Booking = { start: number; end: number; coords: Coords | null };
    const bookings: Booking[] = (bookedSlots || [])
      .map(s => {
        const start = timeToMinutes(s.start_time);
        const duration = s.total_duration_minutes ?? 30;
        const coords: Coords | null =
          s.customer_lat != null && s.customer_lng != null
            ? { lat: s.customer_lat, lng: s.customer_lng }
            : null;
        return { start, end: start + duration + buffer, coords };
      })
      .sort((a, b) => a.start - b.start);

    // 5. Home service mode: customer coords required + travel time slot filtering
    const homeService = merchant.home_service_enabled === true;
    const customerCoords: Coords | null =
      customerLat != null && customerLng != null ? { lat: customerLat, lng: customerLng } : null;
    const shopCoords: Coords | null =
      merchant.shop_lat != null && merchant.shop_lng != null
        ? { lat: merchant.shop_lat, lng: merchant.shop_lng }
        : null;

    if (homeService) {
      if (!customerCoords) {
        return NextResponse.json({ error: 'Adresse cliente requise', requiresAddress: true }, { status: 400 });
      }
      if (!shopCoords) {
        // Marchande à domicile mais shop_address pas géocodée → on ne peut rien proposer
        return NextResponse.json({ slots: [] });
      }
    }

    // 6. Generate candidates every 15 min from open to (close - totalDuration)
    const lastStart = closeMins - totalDuration;
    const baseCandidates: number[] = [];

    for (let t = openMins; t <= lastStart; t += 15) {
      const candidateEnd = t + totalDuration;
      if (breakStart !== null && breakEnd !== null && t < breakEnd && candidateEnd > breakStart) continue;
      const hasConflict = bookings.some(b => t < b.end && candidateEnd > b.start);
      if (!hasConflict) baseCandidates.push(t);
    }

    let validCandidates = baseCandidates;

    if (homeService && customerCoords && shopCoords) {
      // Pré-calcul parallèle des durées de trajet : on dédupe les paires (origin → customer)
      // et (customer → next), puis on appelle getTravelTimes en batch parallèle.
      // Pour chaque candidate : prev∈{bookings|null} et next∈{bookings|null} —
      // donc N+1 origines distinctes (bookings.length + shop) et N+1 destinations.
      const candidateNeighbors = baseCandidates.map((t) => {
        const prev = [...bookings].reverse().find((b) => b.end <= t);
        const next = bookings.find((b) => b.start >= t + totalDuration);
        return { t, prev, next };
      });

      const inOriginsSet = new Set<string>();
      const outDestsSet = new Set<string>();
      const coordKey = (c: Coords) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;

      for (const { prev, next } of candidateNeighbors) {
        inOriginsSet.add(coordKey(prev?.coords ?? shopCoords));
        if (next?.coords) outDestsSet.add(coordKey(next.coords));
      }

      const inOriginsArr = Array.from(inOriginsSet);
      const outDestsArr = Array.from(outDestsSet);

      const inResults = await Promise.all(
        inOriginsArr.map((key) => {
          const [lat, lng] = key.split(',').map(Number);
          return getTravelTime({ lat, lng }, customerCoords);
        })
      );
      const outResults = await Promise.all(
        outDestsArr.map((key) => {
          const [lat, lng] = key.split(',').map(Number);
          return getTravelTime(customerCoords, { lat, lng });
        })
      );

      const inMap = new Map(inOriginsArr.map((k, i) => [k, inResults[i]]));
      const outMap = new Map(outDestsArr.map((k, i) => [k, outResults[i]]));

      const filtered: number[] = [];
      for (const { t, prev, next } of candidateNeighbors) {
        const travelIn = inMap.get(coordKey(prev?.coords ?? shopCoords))!;
        if (travelIn > MAX_TRAVEL_MINUTES) continue;

        // Mode loose pour le 1er RDV : on respecte l'horaire d'ouverture tel quel.
        // L'horaire = "heure du 1er RDV possible", pas "heure de départ de chez la pro".
        // Pour les RDV suivants, on ajoute le trajet entre les deux clientes.
        const earliestStart = prev ? prev.end + travelIn : openMins;
        if (t < earliestStart) continue;

        if (next?.coords) {
          const travelOut = outMap.get(coordKey(next.coords))!;
          if (travelOut > MAX_TRAVEL_MINUTES) continue;
          // Buffer (aléa) appliqué symétriquement : sortie = duration + buffer + travelOut
          if (t + totalDuration + buffer + travelOut > next.start) continue;
        }

        filtered.push(t);
      }
      validCandidates = filtered;
    }

    const slots = validCandidates.map(t => ({ slot_date: date, start_time: minutesToTime(t) }));

    return NextResponse.json({ slots });
  } catch (error) {
    logger.error('Free slots error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
