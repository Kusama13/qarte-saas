import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET: Search merchant's customers by name or phone (for planning autocomplete)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const q = searchParams.get('q')?.trim();

    if (!merchantId || !q || q.length < 2) {
      return NextResponse.json({ customers: [] });
    }

    // Verify merchant ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Single query: JOIN loyalty_cards + customers with ILIKE filter, LIMIT 10
    const pattern = `%${q}%`;
    const { data: customers, error } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, phone_number, instagram_handle, tiktok_handle, facebook_url, loyalty_cards!inner(merchant_id)')
      .eq('loyalty_cards.merchant_id', merchantId)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},phone_number.ilike.${pattern}`)
      .limit(10);

    if (error) {
      logger.error('Customer search error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      customers: (customers || []).map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone_number: c.phone_number,
        instagram_handle: c.instagram_handle,
        tiktok_handle: c.tiktok_handle,
        facebook_url: c.facebook_url,
      })),
    });
  } catch (error) {
    logger.error('Customer search error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
