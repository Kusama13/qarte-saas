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
    { data: monthLogs },
    { data: costData },
  ] = await Promise.all([
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).gte('created_at', firstOfMonth).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).gte('created_at', firstOfWeekIso).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    getGlobalSmsConfig(supabaseAdmin),
    supabaseAdmin.from('sms_logs').select('merchant_id').gte('created_at', firstOfMonth).neq('status', 'failed'),
    supabaseAdmin.from('sms_logs').select('cost_euro').gt('cost_euro', 0),
  ]);

  // Per-merchant breakdown
  const countMap = new Map<string, number>();
  for (const log of monthLogs || []) {
    countMap.set(log.merchant_id, (countMap.get(log.merchant_id) || 0) + 1);
  }

  const merchantIds = [...countMap.keys()];
  const { data: merchantData } = merchantIds.length > 0
    ? await supabaseAdmin.from('merchants').select('id, shop_name').in('id', merchantIds)
    : { data: [] };

  const merchantNameMap = new Map((merchantData || []).map(m => [m.id, m.shop_name]));

  const merchants = [...countMap.entries()].map(([id, sent]) => ({
    merchant_id: id,
    shop_name: merchantNameMap.get(id) || 'Inconnu',
    sent_this_month: sent,
    free_remaining: Math.max(0, SMS_FREE_QUOTA - sent),
    overage_cost: parseFloat((Math.max(0, sent - SMS_FREE_QUOTA) * SMS_OVERAGE_COST).toFixed(2)),
  })).sort((a, b) => b.sent_this_month - a.sent_this_month);

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
