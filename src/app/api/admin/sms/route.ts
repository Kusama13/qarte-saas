import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SMS_OVERAGE_COST, PAID_STATUSES, getQuotaFor } from '@/lib/sms';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms');
  if (auth.response) return auth.response;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const firstOfWeek = new Date(now);
  firstOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const firstOfWeekIso = firstOfWeek.toISOString().slice(0, 10) + 'T00:00:00.000Z';

  const [
    { count: totalAll },
    { count: totalMonth },
    { count: totalWeek },
    { count: totalFailed },
    { data: costData },
  ] = await Promise.all([
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).gte('created_at', firstOfMonth).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).gte('created_at', firstOfWeekIso).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('cost_euro').gt('cost_euro', 0),
  ]);

  // Per-merchant breakdown using billing cycle
  // Fetch all merchants with billing_period_start
  const { data: allMerchantData } = await supabaseAdmin
    .from('merchants')
    .select('id, shop_name, billing_period_start, plan_tier, subscription_status')
    .in('subscription_status', PAID_STATUSES as readonly string[]);

  // Compute each merchant's current billing cycle start
  function getBillingCycleStart(billingPeriodStart: string | null): Date {
    if (!billingPeriodStart) return new Date(now.getFullYear(), now.getMonth(), 1);
    const subDay = new Date(billingPeriodStart).getUTCDate();
    const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), subDay));
    return now < thisMonth
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, subDay))
      : thisMonth;
  }

  // Fetch SMS logs limited to the earliest cycle start (any merchant's cycle started at
  // most 31 days ago) to avoid unbounded scans. Safe because per-merchant filter happens
  // after in JS on a bounded window.
  const earliestCycleStart = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allLogs } = await supabaseAdmin
    .from('sms_logs')
    .select('merchant_id, created_at')
    .neq('status', 'failed')
    .gte('created_at', earliestCycleStart);

  const merchants = (allMerchantData || []).map(m => {
    const cycleStart = getBillingCycleStart(m.billing_period_start);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    const sent = (allLogs || []).filter(l =>
      l.merchant_id === m.id &&
      new Date(l.created_at) >= cycleStart &&
      new Date(l.created_at) < cycleEnd
    ).length;
    const quota = getQuotaFor(m);
    return {
      merchant_id: m.id,
      shop_name: m.shop_name || 'Inconnu',
      plan_tier: m.plan_tier || 'all_in',
      quota,
      sent_this_month: sent,
      free_remaining: Math.max(0, quota - sent),
      overage_cost: parseFloat((Math.max(0, sent - quota) * SMS_OVERAGE_COST).toFixed(2)),
      period_start: cycleStart.toISOString(),
      period_end: cycleEnd.toISOString(),
    };
  }).filter(m => m.sent_this_month > 0).sort((a, b) => b.sent_this_month - a.sent_this_month);

  const totalCost = (costData || []).reduce((sum, r) => sum + Number(r.cost_euro), 0);

  return NextResponse.json({
    totalAll: totalAll || 0,
    totalMonth: totalMonth || 0,
    totalWeek: totalWeek || 0,
    totalFailed: totalFailed || 0,
    totalCost: parseFloat(totalCost.toFixed(2)),
    merchants,
  });
}
