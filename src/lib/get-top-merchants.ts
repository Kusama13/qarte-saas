import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';

export interface TopMerchant {
  shop_name: string;
  shop_type: string;
  logo_url: string | null;
  instagram_url: string | null;
}

export const getTopMerchants = unstable_cache(
  async (): Promise<TopMerchant[]> => {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: admins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    let query = supabaseAdmin
      .from('merchants')
      .select('id, shop_name, shop_type, logo_url, instagram_url, user_id')
      .not('shop_name', 'is', null);

    if (adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }

    const { data: merchants, error } = await query;

    if (error || !merchants?.length) return [];

    const merchantIds = merchants.map((m: { id: string }) => m.id);
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

    return merchants
      .map((m: { id: string; shop_name: string; shop_type: string; logo_url: string | null; instagram_url: string | null; user_id: string }) => ({
        ...m,
        customer_count: countMap[m.id] || 0,
      }))
      .sort((a: { customer_count: number }, b: { customer_count: number }) => b.customer_count - a.customer_count)
      .slice(0, 10)
      .map(({ shop_name, shop_type, logo_url, instagram_url }: { shop_name: string; shop_type: string; logo_url: string | null; instagram_url: string | null }) => ({
        shop_name,
        shop_type,
        logo_url,
        instagram_url,
      }));
  },
  ['top-merchants'],
  { revalidate: 604800 }
);
