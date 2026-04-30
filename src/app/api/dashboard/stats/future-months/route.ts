import { NextRequest, NextResponse } from 'next/server';
import { authorizeMerchant, requirePlanFeature } from '@/lib/api-helpers';
import logger from '@/lib/logger';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
  }

  const auth = await authorizeMerchant(merchantId);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const planBlock = await requirePlanFeature(supabaseAdmin, merchantId, 'planning');
  if (planBlock) return planBlock;

  const now = new Date();
  const m1Year = now.getFullYear() + Math.floor((now.getMonth() + 1) / 12);
  const m1Month = (now.getMonth() + 1) % 12;
  const m2Year = now.getFullYear() + Math.floor((now.getMonth() + 2) / 12);
  const m2Month = (now.getMonth() + 2) % 12;

  const from = `${m1Year}-${pad2(m1Month + 1)}-01`;
  const to = `${m2Year}-${pad2(m2Month + 1)}-${pad2(lastDayOfMonth(m2Year, m2Month))}`;

  try {
    const { data, error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('slot_date')
      .eq('merchant_id', merchantId)
      .gte('slot_date', from)
      .lte('slot_date', to)
      .not('client_name', 'is', null)
      .neq('client_name', '__blocked__')
      .is('primary_slot_id', null);

    if (error) {
      logger.error('future-months query error:', error);
      return NextResponse.json({ months: [] });
    }

    const monthsSet = new Set<string>();
    for (const row of (data || []) as { slot_date: string }[]) {
      monthsSet.add(row.slot_date.slice(0, 7));
    }
    const months = Array.from(monthsSet).sort();

    return NextResponse.json(
      { months },
      { headers: { 'Cache-Control': 'private, max-age=60' } },
    );
  } catch (err) {
    logger.error('future-months error:', err);
    return NextResponse.json({ months: [] });
  }
}
