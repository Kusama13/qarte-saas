/**
 * Admin analytics — Growth tab
 * Sources : RPC admin_growth_weekly (séries hebdo) + admin_growth_rolling (KPIs glissants)
 *           + 3 queries cumulatives (referrals, vouchersBySource, totalCustomers).
 * Tout en parallèle. Cache 5min keyé sur weeksBack (sinon ?weeks=52 retournerait
 * un payload stale 16w après une 1re requête).
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, createTtlCache } from '@/lib/api-helpers';

interface WeeklyRow {
  week_start: string;
  bookings_online: number;
  bookings_manual: number;
  new_customers: number;
  new_cards: number;
  scans: number;
  signups: number;
  paid_conversions: number;
  marketing_sms: number;
  gift_cards_paid_amount: number | string;
}

interface RollingRow {
  net_new_paying_4w: number;
  net_new_paying_4w_prev: number;
  wau: number;
  mau: number;
  booking_online_share: number | string;
  cohort_4w_retention: number | string;
  gift_cards_paid_amount_4w: number | string;
}

const cache = createTtlCache<number, unknown>(5 * 60 * 1000);

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  if (isNaN(d.getTime())) return weekStart;
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const sameMonth = d.getMonth() === end.getMonth();
  const fmt = (date: Date, withMonth: boolean) =>
    date.toLocaleDateString('fr-FR', { day: 'numeric', ...(withMonth ? { month: 'short' } : {}) });
  return `${fmt(d, !sameMonth)} – ${fmt(end, true)}`;
}

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-analytics-growth');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const url = new URL(request.url);
  const weeksBack = Math.min(52, Math.max(4, parseInt(url.searchParams.get('weeks') || '16', 10) || 16));

  const hit = cache.get(weeksBack);
  if (hit) return NextResponse.json(hit);

  try {
    const [weeklyRes, rollingRes, totalCustomersRes, referralsRes, vouchersRes] = await Promise.all([
      supabaseAdmin.rpc('admin_growth_weekly', { weeks_back: weeksBack }),
      supabaseAdmin.rpc('admin_growth_rolling'),
      supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('referrals').select('status'),
      supabaseAdmin.from('vouchers').select('source'),
    ]);

    if (weeklyRes.error) {
      return NextResponse.json({ error: `weekly RPC failed: ${weeklyRes.error.message}` }, { status: 500 });
    }
    if (rollingRes.error) {
      return NextResponse.json({ error: `rolling RPC failed: ${rollingRes.error.message}` }, { status: 500 });
    }

    const weeklyRows = (weeklyRes.data || []) as WeeklyRow[];
    const rolling = ((rollingRes.data || [])[0] || {}) as RollingRow;

    const weeks = weeklyRows.map((r) => ({
      weekStart: r.week_start,
      label: formatWeekLabel(r.week_start),
      bookingsOnline: r.bookings_online,
      bookingsManual: r.bookings_manual,
      newCustomers: r.new_customers,
      newCards: r.new_cards,
      scans: r.scans,
      signups: r.signups,
      paidConversions: r.paid_conversions,
      marketingSms: r.marketing_sms,
      giftCardsPaidAmount: Number(r.gift_cards_paid_amount) || 0,
    }));

    const referrals = (referralsRes.data || []) as { status: string }[];
    const vouchersBySource: Record<string, number> = {};
    for (const v of (vouchersRes.data || []) as { source: string | null }[]) {
      const src = v.source || 'autre';
      vouchersBySource[src] = (vouchersBySource[src] || 0) + 1;
    }

    const payload = {
      weeks,
      rolling: {
        netNewPaying4w: rolling.net_new_paying_4w || 0,
        netNewPaying4wPrev: rolling.net_new_paying_4w_prev || 0,
        wau: rolling.wau || 0,
        mau: rolling.mau || 0,
        wauMauRatio: rolling.mau > 0 ? Math.round((rolling.wau / rolling.mau) * 100) / 100 : 0,
        bookingOnlineShare: Number(rolling.booking_online_share) || 0,
        cohort4wRetention: Number(rolling.cohort_4w_retention) || 0,
        giftCardsPaidAmount4w: Number(rolling.gift_cards_paid_amount_4w) || 0,
      },
      cumulative: {
        totalCustomers: totalCustomersRes.count || 0,
        referrals: {
          total: referrals.length,
          pending: referrals.filter((r) => r.status === 'pending').length,
          completed: referrals.filter((r) => r.status === 'completed').length,
        },
        vouchersBySource: Object.entries(vouchersBySource)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count),
      },
      weeksBack,
    };

    cache.set(weeksBack, payload);
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
