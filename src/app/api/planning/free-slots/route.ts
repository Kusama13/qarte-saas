import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getTodayForCountry } from '@/lib/utils';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const querySchema = z.object({
  merchantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalDuration: z.coerce.number().int().min(1).max(600),
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
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const { merchantId, date, totalDuration } = parsed.data;

    // 1. Fetch merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, booking_mode, buffer_minutes, country, auto_booking_enabled, planning_enabled, opening_hours')
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
      .select('start_time, total_duration_minutes')
      .eq('merchant_id', merchantId)
      .eq('slot_date', date)
      .not('client_name', 'is', null)
      .is('primary_slot_id', null);

    // Build occupied ranges: [startMins, endMins) inclusive of buffer after
    const occupiedRanges = (bookedSlots || []).map(s => {
      const start = timeToMinutes(s.start_time);
      const duration = s.total_duration_minutes ?? 30; // fallback for legacy créneaux-mode slots
      return { start, end: start + duration + buffer };
    });

    // 5. Generate candidates every 15 min from open to (close - totalDuration)
    // No extra buffer deducted from lastStart: buffer is only added AFTER a booking
    const lastStart = closeMins - totalDuration;
    const candidates: string[] = [];

    for (let t = openMins; t <= lastStart; t += 15) {
      const candidateEnd = t + totalDuration;
      // Skip if candidate overlaps with lunch break
      if (breakStart !== null && breakEnd !== null && t < breakEnd && candidateEnd > breakStart) continue;
      const hasConflict = occupiedRanges.some(
        r => t < r.end && candidateEnd > r.start
      );
      if (!hasConflict) {
        candidates.push(minutesToTime(t));
      }
    }

    const slots = candidates.map(start_time => ({ slot_date: date, start_time }));

    return NextResponse.json({ slots });
  } catch (error) {
    logger.error('Free slots error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
