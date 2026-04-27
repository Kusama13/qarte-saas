import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ error: 'Commerçant non trouvé' }, { status: 404 });

    // Ne renvoie que les achats payés ou remboursés (ignore les pending/failed = bruit pour le merchant).
    const { data: purchases } = await supabaseAdmin
      .from('sms_pack_purchases')
      .select('id, pack_size, amount_ttc_cents, status, paid_at, created_at, stripe_invoice_id')
      .eq('merchant_id', merchant.id)
      .in('status', ['paid', 'refunded'])
      .order('paid_at', { ascending: false, nullsFirst: false })
      .limit(20);

    return NextResponse.json({ purchases: purchases || [] });
  } catch (error) {
    logger.error('SMS pack purchases fetch error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
