import { NextRequest, NextResponse } from 'next/server';
import { authorizeMerchant, requirePlanFeature } from '@/lib/api-helpers';
import logger from '@/lib/logger';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Hard floor — avant avril 2026, le planning en ligne n'était pas établi.
// Les stats ne remontent jamais en-deçà.
const STATS_FLOOR = '2026-04-01';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00Z').getTime();
  const b = new Date(to + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

function delta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

/**
 * Calcul des minutes ouvertes sur une plage de dates, selon les horaires d'ouverture.
 * - opening_hours est un JSONB indexé par numéro de jour JS (0 = dimanche, 1 = lundi, ..., 6 = samedi)
 * - Format par jour : { open: "09:00", close: "18:00", break_start?: "12:00", break_end?: "13:00" }
 * - Jour fermé = clé absente ou valeur null
 */
type DayHours = { open: string; close: string; break_start?: string | null; break_end?: string | null } | null;
type OpeningHours = Record<string, DayHours> | null | undefined;

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
}

function computeOpenMinutes(openingHours: OpeningHours, from: string, to: string): number {
  if (!openingHours) return 0;
  let total = 0;
  const cursor = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (cursor <= end) {
    const jsDay = cursor.getUTCDay();
    const hours = openingHours[String(jsDay)];
    if (hours) {
      const openMin = parseHHMM(hours.open);
      const closeMin = parseHHMM(hours.close);
      let dayMinutes = Math.max(0, closeMin - openMin);
      if (hours.break_start && hours.break_end) {
        dayMinutes -= Math.max(0, parseHHMM(hours.break_end) - parseHHMM(hours.break_start));
      }
      total += Math.max(0, dayMinutes);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return total;
}

function slotDurationMinutes(slot: {
  total_duration_minutes: number | null;
  planning_slot_services?: Array<{ service: { duration: number | null } | { duration: number | null }[] | null }> | null;
}): number {
  if (slot.total_duration_minutes != null) return slot.total_duration_minutes;
  const services = slot.planning_slot_services || [];
  return services.reduce((sum, ps) => {
    const svc = Array.isArray(ps.service) ? ps.service[0] : ps.service;
    return sum + Number(svc?.duration || 0);
  }, 0);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get('merchantId');
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');

  const { from: defaultFrom, to: defaultTo } = currentMonthRange();
  const from = fromParam || defaultFrom;
  const to = toParam || defaultTo;

  if (!merchantId || !DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return NextResponse.json({ error: 'params invalides' }, { status: 400 });
  }

  // Clamp to floor — les stats ne remontent pas avant avril 2026
  const safeFrom = from < STATS_FLOOR ? STATS_FLOOR : from;
  if (safeFrom > to) {
    return NextResponse.json({ error: 'période avant avril 2026' }, { status: 400 });
  }

  const auth = await authorizeMerchant(merchantId);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const planBlock = await requirePlanFeature(supabaseAdmin, merchantId, 'planning');
  if (planBlock) return planBlock;

  // Période précédente = même nombre de jours juste avant (clampée au floor)
  const periodDays = daysBetween(safeFrom, to);
  const prevToRaw = addDays(safeFrom, -1);
  const prevFromRaw = addDays(prevToRaw, -(periodDays - 1));
  const prevFrom = prevFromRaw < STATS_FLOOR ? STATS_FLOOR : prevFromRaw;
  const prevTo = prevToRaw < STATS_FLOOR ? STATS_FLOOR : prevToRaw;
  const hasPrevious = prevFromRaw >= STATS_FLOOR;

  try {
    const [
      merchantRes,
      slotsRes,
      prevSlotsRes,
      newCustRes,
      prevNewCustRes,
      vouchersRes,
      prevVouchersRes,
      referralsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('merchants')
        .select('id, opening_hours, booking_mode')
        .eq('id', merchantId)
        .maybeSingle(),

      supabaseAdmin
        .from('merchant_planning_slots')
        .select('id, slot_date, start_time, client_name, attendance_status, total_duration_minutes, custom_service_price, planning_slot_services(service:merchant_services!service_id(id, name, price, duration))')
        .eq('merchant_id', merchantId)
        .gte('slot_date', safeFrom)
        .lte('slot_date', to)
        .is('primary_slot_id', null),

      hasPrevious
        ? supabaseAdmin
            .from('merchant_planning_slots')
            .select('id, slot_date, client_name, attendance_status, total_duration_minutes, custom_service_price, planning_slot_services(service:merchant_services!service_id(price, duration))')
            .eq('merchant_id', merchantId)
            .gte('slot_date', prevFrom)
            .lte('slot_date', prevTo)
            .is('primary_slot_id', null)
        : Promise.resolve({ data: [] }),

      supabaseAdmin
        .from('loyalty_cards')
        .select('id, customer_id, created_at', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .gte('created_at', safeFrom)
        .lte('created_at', to + 'T23:59:59'),

      hasPrevious
        ? supabaseAdmin
            .from('loyalty_cards')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .gte('created_at', prevFrom)
            .lte('created_at', prevTo + 'T23:59:59')
        : Promise.resolve({ count: 0 }),

      supabaseAdmin
        .from('vouchers')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .eq('is_used', true)
        .gte('used_at', safeFrom)
        .lte('used_at', to + 'T23:59:59'),

      hasPrevious
        ? supabaseAdmin
            .from('vouchers')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .eq('is_used', true)
            .gte('used_at', prevFrom)
            .lte('used_at', prevTo + 'T23:59:59')
        : Promise.resolve({ count: 0 }),

      supabaseAdmin
        .from('referrals')
        .select('id, status')
        .eq('merchant_id', merchantId)
        .gte('created_at', safeFrom)
        .lte('created_at', to + 'T23:59:59'),
    ]);

    const merchant = merchantRes.data as { opening_hours: OpeningHours; booking_mode?: string | null } | null;
    const openingHours = merchant?.opening_hours || null;
    const bookingMode = merchant?.booking_mode || 'slots';

    type ServiceInfo = { id: string; name: string; price: number | null; duration: number | null };
    type SlotServiceRow = { service: ServiceInfo | ServiceInfo[] | null };
    type SlotRow = {
      id: string;
      slot_date: string;
      start_time?: string;
      client_name: string | null;
      attendance_status: string | null;
      total_duration_minutes: number | null;
      custom_service_price?: number | null;
      planning_slot_services: SlotServiceRow[] | null;
    };

    const slots: SlotRow[] = (slotsRes.data as SlotRow[]) || [];
    const prevSlots: SlotRow[] = (prevSlotsRes.data as SlotRow[]) || [];

    const slotRevenue = (slot: SlotRow): number => {
      const catalog = (slot.planning_slot_services || []).reduce((sum, ps) => {
        const svc = Array.isArray(ps.service) ? ps.service[0] : ps.service;
        return sum + Number(svc?.price || 0);
      }, 0);
      return catalog + Number(slot.custom_service_price || 0);
    };

    const isBlocked = (s: SlotRow) => s.client_name === '__blocked__';
    const isBooked = (s: SlotRow) => s.client_name && s.client_name !== '__blocked__';
    const isCompleted = (s: SlotRow) => isBooked(s) && s.attendance_status !== 'cancelled';

    // Revenue = prix des slots avec client, hors cancelled
    const revenueCurrent = slots.filter(isCompleted).reduce((sum, s) => sum + slotRevenue(s), 0);
    const revenuePrev = prevSlots.filter(isCompleted).reduce((sum, s) => sum + slotRevenue(s), 0);

    // Bookings count
    const bookingsCurrent = slots.filter(isBooked).length;
    const bookingsPrev = prevSlots.filter(isBooked).length;

    // Fill rate :
    // - Mode libre : minutes bookées / (minutes ouvertes - minutes bloquées par le merchant)
    // - Mode créneaux : idem (cohérent, honore les pauses + blocages)
    const openMinutesCurrent = computeOpenMinutes(openingHours, safeFrom, to);
    const blockedMinutesCurrent = slots.filter(isBlocked).reduce((sum, s) => sum + slotDurationMinutes(s), 0);
    const bookedMinutesCurrent = slots.filter(isCompleted).reduce((sum, s) => sum + slotDurationMinutes(s), 0);
    const availableMinutesCurrent = Math.max(0, openMinutesCurrent - blockedMinutesCurrent);
    const fillCurrent = availableMinutesCurrent ? bookedMinutesCurrent / availableMinutesCurrent : 0;

    const openMinutesPrev = hasPrevious ? computeOpenMinutes(openingHours, prevFrom, prevTo) : 0;
    const blockedMinutesPrev = prevSlots.filter(isBlocked).reduce((sum, s) => sum + slotDurationMinutes(s), 0);
    const bookedMinutesPrev = prevSlots.filter(isCompleted).reduce((sum, s) => sum + slotDurationMinutes(s), 0);
    const availableMinutesPrev = Math.max(0, openMinutesPrev - blockedMinutesPrev);
    const fillPrev = availableMinutesPrev ? bookedMinutesPrev / availableMinutesPrev : 0;

    // No-show rate
    const markedCurrent = slots.filter((s) => s.attendance_status === 'attended' || s.attendance_status === 'no_show');
    const markedPrev = prevSlots.filter((s) => s.attendance_status === 'attended' || s.attendance_status === 'no_show');
    const noShowCurrent = markedCurrent.length
      ? markedCurrent.filter((s) => s.attendance_status === 'no_show').length / markedCurrent.length
      : 0;
    const noShowPrev = markedPrev.length
      ? markedPrev.filter((s) => s.attendance_status === 'no_show').length / markedPrev.length
      : 0;

    // Top services
    const serviceAgg = new Map<string, { name: string; count: number; revenue: number }>();
    for (const s of slots.filter(isCompleted)) {
      for (const ps of s.planning_slot_services || []) {
        const svc = Array.isArray(ps.service) ? ps.service[0] : ps.service;
        if (!svc?.id) continue;
        const existing = serviceAgg.get(svc.id) || { name: svc.name, count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(svc.price || 0);
        serviceAgg.set(svc.id, existing);
      }
    }
    const topServices = Array.from(serviceAgg.entries())
      .map(([id, v]) => ({ service_id: id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Timeline revenue/day
    const timelineMap = new Map<string, { revenue: number; bookings: number }>();
    for (const s of slots.filter(isCompleted)) {
      const cur = timelineMap.get(s.slot_date) || { revenue: 0, bookings: 0 };
      cur.revenue += slotRevenue(s);
      cur.bookings += 1;
      timelineMap.set(s.slot_date, cur);
    }
    const timeline = Array.from(timelineMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fill rate par jour de semaine (lundi = 1, dimanche = 7) — en minutes
    const dayAgg = Array.from({ length: 7 }, () => ({ bookedMin: 0, availableMin: 0 }));
    const cursor = new Date(safeFrom + 'T00:00:00Z');
    const endDate = new Date(to + 'T00:00:00Z');
    while (cursor <= endDate) {
      const jsDay = cursor.getUTCDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      const hours = openingHours?.[String(jsDay)];
      if (hours) {
        let dayOpen = Math.max(0, parseHHMM(hours.close) - parseHHMM(hours.open));
        if (hours.break_start && hours.break_end) {
          dayOpen -= Math.max(0, parseHHMM(hours.break_end) - parseHHMM(hours.break_start));
        }
        dayAgg[idx].availableMin += Math.max(0, dayOpen);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    for (const s of slots) {
      if (!isCompleted(s)) continue;
      const d = new Date(s.slot_date + 'T00:00:00Z');
      const jsDay = d.getUTCDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      dayAgg[idx].bookedMin += slotDurationMinutes(s);
    }
    // Subtract blocked minutes from availability
    for (const s of slots.filter(isBlocked)) {
      const d = new Date(s.slot_date + 'T00:00:00Z');
      const jsDay = d.getUTCDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      dayAgg[idx].availableMin = Math.max(0, dayAgg[idx].availableMin - slotDurationMinutes(s));
    }
    const fillByDayOfWeek = dayAgg.map((v, i) => ({
      day: i + 1,
      fillRate: v.availableMin ? v.bookedMin / v.availableMin : 0,
      bookedMin: v.bookedMin,
      availableMin: v.availableMin,
    }));

    // Fidélité
    const newCustomersCount = newCustRes.count || 0;
    const prevNewCustomersCount = prevNewCustRes.count || 0;

    const { data: visitsData } = await supabaseAdmin
      .from('visits')
      .select('loyalty_card_id, loyalty_cards!inner(customer_id, customers!inner(first_name, last_name))')
      .eq('merchant_id', merchantId)
      .gte('visited_at', safeFrom)
      .lte('visited_at', to + 'T23:59:59');

    type VisitRow = {
      loyalty_card_id: string;
      loyalty_cards:
        | { customer_id: string; customers: { first_name: string; last_name: string | null } }
        | { customer_id: string; customers: { first_name: string; last_name: string | null } }[];
    };
    const topClientsAgg = new Map<string, { name: string; visits: number }>();
    for (const row of (visitsData as VisitRow[] | null) || []) {
      const lc = Array.isArray(row.loyalty_cards) ? row.loyalty_cards[0] : row.loyalty_cards;
      const cust = Array.isArray(lc?.customers) ? lc.customers[0] : lc?.customers;
      if (!cust) continue;
      const key = row.loyalty_card_id;
      const name = `${cust.first_name}${cust.last_name ? ' ' + cust.last_name.charAt(0) + '.' : ''}`;
      const existing = topClientsAgg.get(key) || { name, visits: 0 };
      existing.visits += 1;
      topClientsAgg.set(key, existing);
    }
    const topClients = Array.from(topClientsAgg.entries())
      .map(([id, v]) => ({ loyalty_card_id: id, ...v }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    const distinctCustomers = topClientsAgg.size;
    const returningCustomers = Array.from(topClientsAgg.values()).filter((c) => c.visits >= 2).length;
    const returningRate = distinctCustomers ? returningCustomers / distinctCustomers : 0;

    const newCustTimelineMap = new Map<string, number>();
    for (const card of newCustRes.data || []) {
      const d = (card.created_at as string).slice(0, 10);
      newCustTimelineMap.set(d, (newCustTimelineMap.get(d) || 0) + 1);
    }
    const newCustomersTimeline = Array.from(newCustTimelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const referrals = (referralsRes.data || []) as { status: string }[];
    const referralsInvited = referrals.length;
    const referralsConverted = referrals.filter((r) => r.status === 'completed').length;
    const referralsConversionRate = referralsInvited ? referralsConverted / referralsInvited : 0;

    return NextResponse.json({
      period: { from: safeFrom, to, days: periodDays, bookingMode },
      previousPeriod: hasPrevious ? { from: prevFrom, to: prevTo } : null,
      planning: {
        revenue: { current: Math.round(revenueCurrent), previous: Math.round(revenuePrev), delta: delta(revenueCurrent, revenuePrev) },
        bookings: { current: bookingsCurrent, previous: bookingsPrev, delta: delta(bookingsCurrent, bookingsPrev) },
        fillRate: {
          current: fillCurrent,
          previous: fillPrev,
          bookedMinutes: bookedMinutesCurrent,
          availableMinutes: availableMinutesCurrent,
        },
        noShowRate: {
          current: noShowCurrent,
          previous: noShowPrev,
          marked: markedCurrent.length,
          noShows: markedCurrent.filter((s) => s.attendance_status === 'no_show').length,
        },
        topServices,
        timeline,
        fillByDayOfWeek,
      },
      fidelite: {
        newCustomers: { current: newCustomersCount, previous: prevNewCustomersCount, delta: delta(newCustomersCount, prevNewCustomersCount) },
        returningRate: { current: returningRate, returning: returningCustomers, distinct: distinctCustomers },
        vouchersRedeemed: { current: vouchersRes.count || 0, previous: prevVouchersRes.count || 0, delta: delta(vouchersRes.count || 0, prevVouchersRes.count || 0) },
        topClients,
        newCustomersTimeline,
        referrals: { invited: referralsInvited, converted: referralsConverted, conversionRate: referralsConversionRate },
      },
    });
  } catch (error) {
    logger.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
