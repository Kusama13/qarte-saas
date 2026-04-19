import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { getSmsUsageThisMonth, getEffectiveQuota } from '@/lib/sms';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
  }

  const supabase = await createRouteHandlerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Verify merchant ownership
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, billing_period_start, sms_pack_balance, plan_tier, subscription_status, sms_quota_override, sms_quota_override_cycle_anchor')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const usage = await getSmsUsageThisMonth(supabase, merchantId, merchant.billing_period_start, 100);
  const quota = getEffectiveQuota(merchant, usage.periodStart);
  const packBalance = Number((merchant as { sms_pack_balance?: number }).sms_pack_balance || 0);
  return NextResponse.json({ ...usage, packBalance, quota });
}
