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

    // Get customer IDs linked to this merchant via loyalty_cards
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from('loyalty_cards')
      .select('customer_id')
      .eq('merchant_id', merchantId);

    if (cardsError || !cards || cards.length === 0) {
      return NextResponse.json({ customers: [] });
    }

    const customerIds = cards.map(c => c.customer_id);

    // Fetch those customers and filter by search query
    const { data: allCustomers, error } = await supabaseAdmin
      .from('customers')
      .select('id, first_name, last_name, phone_number, instagram_handle, tiktok_handle, facebook_url')
      .in('id', customerIds);

    if (error) {
      logger.error('Customer search error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const qLower = q.toLowerCase();
    const customers = (allCustomers || [])
      .filter(c => {
        const fullName = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
        return fullName.includes(qLower) || c.phone_number.includes(q);
      })
      .slice(0, 8)
      .map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        phone_number: c.phone_number,
        instagram_handle: c.instagram_handle,
        tiktok_handle: c.tiktok_handle,
        facebook_url: c.facebook_url,
      }));

    return NextResponse.json({ customers });
  } catch (error) {
    logger.error('Customer search error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
