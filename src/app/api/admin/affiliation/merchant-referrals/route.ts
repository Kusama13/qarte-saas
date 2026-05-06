import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';

/**
 * Admin GET — liste tous les merchants parraines par un autre merchant.
 * Retourne le filleul + le parrain pour chaque relation referred_by_merchant_id.
 * Utilise par l'onglet "Parrainages merchants" dans /admin/affiliation.
 */
export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-affiliation-merchant-referrals');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { data, error } = await supabaseAdmin
    .from('merchants')
    .select(`
      id,
      shop_name,
      slug,
      created_at,
      subscription_status,
      trial_ends_at,
      referred_by_merchant_id,
      parent:referred_by_merchant_id (id, shop_name, slug)
    `)
    .not('referred_by_merchant_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch merchant referrals' }, { status: 500 });
  }

  return NextResponse.json({ referrals: data || [] });
}
