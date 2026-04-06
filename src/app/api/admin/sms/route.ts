import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getGlobalSmsConfig, SMS_FREE_QUOTA, SMS_OVERAGE_COST } from '@/lib/sms';

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
    globalConfig,
    { data: costData },
  ] = await Promise.all([
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).gte('created_at', firstOfMonth).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).gte('created_at', firstOfWeekIso).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    getGlobalSmsConfig(supabaseAdmin),
    supabaseAdmin.from('sms_logs').select('cost_euro').gt('cost_euro', 0),
  ]);

  // Per-merchant breakdown using billing cycle
  // Fetch all merchants with billing_period_start
  const { data: allMerchantData } = await supabaseAdmin
    .from('merchants')
    .select('id, shop_name, billing_period_start')
    .in('subscription_status', ['active', 'canceling', 'past_due']);

  // Compute each merchant's current billing cycle start
  function getBillingCycleStart(billingPeriodStart: string | null): Date {
    if (!billingPeriodStart) return new Date(now.getFullYear(), now.getMonth(), 1);
    const subDay = new Date(billingPeriodStart).getUTCDate();
    const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), subDay));
    return now < thisMonth
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, subDay))
      : thisMonth;
  }

  // For each merchant, count SMS in their billing cycle
  // Get all SMS logs (non-failed) to count per merchant per cycle
  const { data: allLogs } = await supabaseAdmin
    .from('sms_logs')
    .select('merchant_id, created_at')
    .neq('status', 'failed');

  const merchants = (allMerchantData || []).map(m => {
    const cycleStart = getBillingCycleStart(m.billing_period_start);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    const sent = (allLogs || []).filter(l =>
      l.merchant_id === m.id &&
      new Date(l.created_at) >= cycleStart &&
      new Date(l.created_at) < cycleEnd
    ).length;
    return {
      merchant_id: m.id,
      shop_name: m.shop_name || 'Inconnu',
      sent_this_month: sent,
      free_remaining: Math.max(0, SMS_FREE_QUOTA - sent),
      overage_cost: parseFloat((Math.max(0, sent - SMS_FREE_QUOTA) * SMS_OVERAGE_COST).toFixed(2)),
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
    globalConfig,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms');
  if (auth.response) return auth.response;

  const body = await request.json();
  const { reminder_enabled, confirmation_enabled, birthday_enabled, referral_enabled } = body;

  const { error } = await supabaseAdmin
    .from('app_config')
    .update({
      value: {
        reminder_enabled: reminder_enabled !== false,
        confirmation_enabled: confirmation_enabled !== false,
        birthday_enabled: birthday_enabled !== false,
        referral_enabled: referral_enabled !== false,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('key', 'sms_global');

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
