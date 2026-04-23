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

function getCategory(smsType: string): CategoryKey {
  for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
    if ((types as string[]).includes(smsType)) return cat as CategoryKey;
  }
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

  // Build main query before Promise.all so it runs concurrently with stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mainQueryPromise: Promise<{ data: any[] | null; count: number | null }>;

  if (category === 'essai') {
    mainQueryPromise = supabaseAdmin
      .from('merchant_marketing_sms_logs')
      .select('id, merchant_id, sms_type, body, status, error_message, sent_at', { count: 'exact' })
      .order('sent_at', { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .range(offset, offset + PAGE_SIZE - 1) as any;
  } else {
    let q = supabaseAdmin
      .from('sms_logs')
      .select('id, merchant_id, phone_to, sms_type, message_body, status, error_message, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (category !== 'all') {
      q = q.in('sms_type', CATEGORY_TYPES[category as Exclude<CategoryKey, 'essai'>]);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mainQueryPromise = q as any;
  }

  const [
    { data: typeStatsData },
    { count: essaiCount30 },
    { data: rawData, count },
  ] = await Promise.all([
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
    mainQueryPromise,
  ]);

  // Compute category stats
  const catCounts: Record<string, number> = {};
  for (const row of typeStatsData || []) {
    const cat = getCategory(row.sms_type);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  catCounts.essai = essaiCount30 || 0;
  const stats = {
    all: Object.values(catCounts).reduce((s, n) => s + n, 0),
    ...catCounts,
  };

  // Fetch merchant names
  const merchantIds = Array.from(new Set((rawData || []).map((r) => r.merchant_id as string).filter(Boolean)));
  const { data: merchantsData } = merchantIds.length
    ? await supabaseAdmin.from('merchants').select('id, shop_name').in('id', merchantIds)
    : { data: [] as { id: string; shop_name: string | null }[] };
  const merchantMap = new Map((merchantsData || []).map((m) => [m.id, m.shop_name || 'Inconnu']));

  const isEssai = category === 'essai';
  const logs = (rawData || []).map((row) => ({
    id: row.id as string,
    source: isEssai ? 'essai' : 'sms',
    merchant_id: row.merchant_id as string,
    shop_name: merchantMap.get(row.merchant_id as string) || '—',
    phone_to: isEssai ? null : (row.phone_to as string | null),
    sms_type: row.sms_type as string,
    category: isEssai ? 'essai' : getCategory(row.sms_type as string),
    message_body: isEssai ? (row.body as string) : (row.message_body as string),
    status: row.status as string,
    error_message: (row.error_message as string | null) ?? null,
    created_at: isEssai ? (row.sent_at as string) : (row.created_at as string),
  }));

  return NextResponse.json({ logs, total: count || 0, page, pageSize: PAGE_SIZE, stats });
}
