import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

const PAGE_SIZE = 50;

type CategoryKey = 'rappel' | 'confirmation' | 'fidelite' | 'conversion' | 'avis' | 'campagne' | 'essai';

const CATEGORY_TYPES: Record<Exclude<CategoryKey, 'essai'>, string[]> = {
  rappel: ['reminder_j1', 'reminder_j0'],
  confirmation: ['confirmation_no_deposit', 'confirmation_deposit', 'booking_moved', 'booking_cancelled'],
  fidelite: ['birthday', 'referral_reward', 'near_reward', 'welcome'],
  conversion: ['inactive_reminder', 'voucher_expiry', 'referral_invite'],
  avis: ['review_request'],
  campagne: ['campaign'],
};

// SMS types logged to merchant_marketing_sms_logs (sent to merchants, not customers)
const MERCHANT_SMS_TYPES = [
  'celebration_fidelity',
  'celebration_planning',
  'celebration_vitrine',
  'checkin_nudge',
  'checkin_combo',
  'trial_pre_loss',
  'churn_survey',
];

function getCategory(smsType: string): CategoryKey {
  for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
    if ((types as string[]).includes(smsType)) return cat as CategoryKey;
  }
  if (MERCHANT_SMS_TYPES.includes(smsType)) return 'essai';
  return 'campagne';
}

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms-history');
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10));
  const offset = page * PAGE_SIZE;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Stats queries run in all cases
  const [{ data: typeStatsData }, { count: essaiCount30 }] = await Promise.all([
    supabaseAdmin
      .from('sms_logs')
      .select('sms_type')
      .gte('created_at', thirtyDaysAgo)
      .neq('status', 'failed'),
    supabaseAdmin
      .from('merchant_marketing_sms_logs')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', thirtyDaysAgo)
      .neq('status', 'failed'),
  ]);

  // Compute category stats
  const catCounts: Record<string, number> = {};
  for (const row of typeStatsData || []) {
    const cat = getCategory(row.sms_type);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  catCounts.essai = essaiCount30 || 0;
  const stats = {
    all: (typeStatsData?.length || 0) + (essaiCount30 || 0),
    ...catCounts,
  };

  // Build unified log list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logs: any[] = [];
  let total = 0;

  if (category === 'essai') {
    const { data, count } = await supabaseAdmin
      .from('merchant_marketing_sms_logs')
      .select('id, merchant_id, sms_type, body, status, error_message, sent_at', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const merchantIds = Array.from(new Set((data || []).map((r) => r.merchant_id as string).filter(Boolean)));
    const { data: merchantsData } = merchantIds.length
      ? await supabaseAdmin.from('merchants').select('id, shop_name').in('id', merchantIds)
      : { data: [] as { id: string; shop_name: string | null }[] };
    const merchantMap = new Map((merchantsData || []).map((m) => [m.id, m.shop_name || 'Inconnu']));

    logs = (data || []).map((row) => ({
      id: row.id as string,
      source: 'essai',
      merchant_id: row.merchant_id as string,
      shop_name: merchantMap.get(row.merchant_id as string) || '—',
      phone_to: null,
      sms_type: row.sms_type as string,
      category: 'essai',
      message_body: row.body as string,
      status: row.status as string,
      error_message: (row.error_message as string | null) ?? null,
      created_at: row.sent_at as string,
    }));
    total = count || 0;

  } else if (category === 'all') {
    // Merge sms_logs + merchant_marketing_sms_logs, sorted by date
    // Fetch extra rows to handle merge-sorting across two tables
    const fetchLimit = PAGE_SIZE * 3;
    const [smsRes, mktRes] = await Promise.all([
      supabaseAdmin
        .from('sms_logs')
        .select('id, merchant_id, phone_to, sms_type, message_body, status, error_message, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, fetchLimit - 1),
      supabaseAdmin
        .from('merchant_marketing_sms_logs')
        .select('id, merchant_id, sms_type, body, status, error_message, sent_at', { count: 'exact' })
        .order('sent_at', { ascending: false })
        .range(0, fetchLimit - 1),
    ]);

    type MergedRow = {
      id: string; merchant_id: string; phone_to: string | null;
      sms_type: string; message_body: string; status: string;
      error_message: string | null; created_at: string; _source: 'sms' | 'essai';
    };

    const merged: MergedRow[] = [
      ...(smsRes.data || []).map((r) => ({
        id: r.id as string, merchant_id: r.merchant_id as string,
        phone_to: r.phone_to as string | null, sms_type: r.sms_type as string,
        message_body: r.message_body as string, status: r.status as string,
        error_message: (r.error_message as string | null) ?? null,
        created_at: r.created_at as string, _source: 'sms' as const,
      })),
      ...(mktRes.data || []).map((r) => ({
        id: r.id as string, merchant_id: r.merchant_id as string,
        phone_to: null, sms_type: r.sms_type as string,
        message_body: r.body as string, status: r.status as string,
        error_message: (r.error_message as string | null) ?? null,
        created_at: r.sent_at as string, _source: 'essai' as const,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const paged = merged.slice(offset, offset + PAGE_SIZE);
    total = (smsRes.count || 0) + (mktRes.count || 0);

    const merchantIds = Array.from(new Set(paged.map((r) => r.merchant_id).filter(Boolean)));
    const { data: merchantsData } = merchantIds.length
      ? await supabaseAdmin.from('merchants').select('id, shop_name').in('id', merchantIds)
      : { data: [] as { id: string; shop_name: string | null }[] };
    const merchantMap = new Map((merchantsData || []).map((m) => [m.id, m.shop_name || 'Inconnu']));

    logs = paged.map((row) => ({
      id: row.id,
      source: row._source,
      merchant_id: row.merchant_id,
      shop_name: merchantMap.get(row.merchant_id) || '—',
      phone_to: row.phone_to,
      sms_type: row.sms_type,
      category: getCategory(row.sms_type),
      message_body: row.message_body,
      status: row.status,
      error_message: row.error_message,
      created_at: row.created_at,
    }));

  } else {
    // Specific category (sms_logs only)
    let q = supabaseAdmin
      .from('sms_logs')
      .select('id, merchant_id, phone_to, sms_type, message_body, status, error_message, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    q = q.in('sms_type', CATEGORY_TYPES[category as Exclude<CategoryKey, 'essai'>]);

    const { data, count } = await q;

    const merchantIds = Array.from(new Set((data || []).map((r) => r.merchant_id as string).filter(Boolean)));
    const { data: merchantsData } = merchantIds.length
      ? await supabaseAdmin.from('merchants').select('id, shop_name').in('id', merchantIds)
      : { data: [] as { id: string; shop_name: string | null }[] };
    const merchantMap = new Map((merchantsData || []).map((m) => [m.id, m.shop_name || 'Inconnu']));

    logs = (data || []).map((row) => ({
      id: row.id as string,
      source: 'sms',
      merchant_id: row.merchant_id as string,
      shop_name: merchantMap.get(row.merchant_id as string) || '—',
      phone_to: row.phone_to as string | null,
      sms_type: row.sms_type as string,
      category: getCategory(row.sms_type as string),
      message_body: row.message_body as string,
      status: row.status as string,
      error_message: (row.error_message as string | null) ?? null,
      created_at: row.created_at as string,
    }));
    total = count || 0;
  }

  return NextResponse.json({ logs, total, page, pageSize: PAGE_SIZE, stats });
}
