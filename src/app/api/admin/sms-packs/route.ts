import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms-packs');
  if (auth.response) return auth.response;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: paidAllTime },
    { data: paidThisMonth },
    { data: refunded },
    { data: recentPaid },
  ] = await Promise.all([
    supabaseAdmin.from('sms_pack_purchases').select('amount_ttc_cents, pack_size').eq('status', 'paid'),
    supabaseAdmin.from('sms_pack_purchases').select('amount_ttc_cents, pack_size').eq('status', 'paid').gte('paid_at', firstOfMonth),
    supabaseAdmin.from('sms_pack_purchases').select('amount_ttc_cents, pack_size').eq('status', 'refunded'),
    supabaseAdmin
      .from('sms_pack_purchases')
      .select('id, pack_size, amount_ttc_cents, status, paid_at, merchant_id, merchants:merchants(shop_name)')
      .in('status', ['paid', 'refunded'])
      .order('paid_at', { ascending: false, nullsFirst: false })
      .limit(30),
  ]);

  const sumCents = (rows: Array<{ amount_ttc_cents: number | null }> | null) =>
    (rows || []).reduce((acc, r) => acc + Number(r.amount_ttc_cents || 0), 0);
  const sumPacks = (rows: Array<{ pack_size: number | null }> | null) =>
    (rows || []).reduce((acc, r) => acc + Number(r.pack_size || 0), 0);

  return NextResponse.json({
    stats: {
      revenueAllTimeCents: sumCents(paidAllTime),
      revenueThisMonthCents: sumCents(paidThisMonth),
      refundedCents: sumCents(refunded),
      smsCreditedAllTime: sumPacks(paidAllTime),
      smsCreditedThisMonth: sumPacks(paidThisMonth),
      smsRefunded: sumPacks(refunded),
      paidCount: (paidAllTime || []).length,
      refundedCount: (refunded || []).length,
    },
    recent: recentPaid || [],
  });
}
