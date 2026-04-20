import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms-failures');
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: logs } = await supabaseAdmin
    .from('sms_logs')
    .select('id, merchant_id, phone_to, sms_type, error_message, created_at')
    .eq('status', 'failed')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(limit);

  const merchantIds = Array.from(new Set((logs || []).map(l => l.merchant_id).filter(Boolean)));
  const { data: merchants } = merchantIds.length
    ? await supabaseAdmin
        .from('merchants')
        .select('id, shop_name')
        .in('id', merchantIds)
    : { data: [] as { id: string; shop_name: string | null }[] };

  const merchantMap = new Map((merchants || []).map(m => [m.id, m.shop_name || 'Inconnu']));

  const failures = (logs || []).map(l => ({
    id: l.id,
    merchant_id: l.merchant_id,
    shop_name: merchantMap.get(l.merchant_id) || 'Inconnu',
    phone_to: l.phone_to,
    sms_type: l.sms_type,
    error_message: l.error_message || 'Aucun détail',
    created_at: l.created_at,
  }));

  return NextResponse.json({ failures });
}
