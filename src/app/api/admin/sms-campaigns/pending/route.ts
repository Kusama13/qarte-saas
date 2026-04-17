import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms-campaigns');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { data: campaigns } = await supabaseAdmin!
    .from('sms_campaigns')
    .select('id, merchant_id, body, audience_filter, recipient_count, scheduled_at, cost_cents, created_at, kind, status')
    .in('status', ['pending_review'])
    .order('created_at', { ascending: true });

  const merchantIds = Array.from(new Set((campaigns || []).map((c: { merchant_id: string }) => c.merchant_id)));
  const { data: merchants } = merchantIds.length
    ? await supabaseAdmin!
        .from('merchants')
        .select('id, shop_name, country')
        .in('id', merchantIds)
    : { data: [] };

  const merchantMap = new Map((merchants || []).map((m: { id: string; shop_name: string; country: string | null }) => [m.id, m]));

  const enriched = (campaigns || []).map((c: { merchant_id: string } & Record<string, unknown>) => ({
    ...c,
    merchant: merchantMap.get(c.merchant_id) || null,
  }));

  return NextResponse.json({ campaigns: enriched });
}
