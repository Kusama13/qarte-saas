import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

// Public API — returns top merchants by customer count for landing social proof
// Cached for 1 hour via CDN headers
export async function GET() {
  // Get admin user_ids to exclude
  const { data: admins } = await supabaseAdmin
    .from('super_admins')
    .select('user_id');
  const adminIds = (admins || []).map(a => a.user_id);

  // Get all merchants (non-admin, with a shop_name)
  let query = supabaseAdmin
    .from('merchants')
    .select('id, shop_name, shop_type, logo_url, instagram_url, user_id')
    .not('shop_name', 'is', null);

  if (adminIds.length > 0) {
    query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
  }

  const { data: merchants, error } = await query;

  if (error || !merchants?.length) {
    return NextResponse.json({ merchants: [] });
  }

  // Count loyalty cards per merchant
  const merchantIds = merchants.map(m => m.id);
  const { data: counts } = await supabaseAdmin
    .from('loyalty_cards')
    .select('merchant_id')
    .in('merchant_id', merchantIds);

  const countMap: Record<string, number> = {};
  if (counts) {
    for (const row of counts) {
      countMap[row.merchant_id] = (countMap[row.merchant_id] || 0) + 1;
    }
  }

  // Sort by customer count descending, take top 10
  const ranked = merchants
    .map(m => ({ ...m, customer_count: countMap[m.id] || 0 }))
    .sort((a, b) => b.customer_count - a.customer_count)
    .slice(0, 10)
    .map(({ id: _id, customer_count: _count, user_id: _uid, ...rest }) => rest);

  return NextResponse.json(
    { merchants: ranked },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      },
    }
  );
}
