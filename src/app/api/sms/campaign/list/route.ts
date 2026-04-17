import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));
    if (!merchantId) return NextResponse.json({ error: 'merchantId required' }, { status: 400 });

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const { data } = await supabaseAdmin
      .from('sms_campaigns')
      .select('id, body, recipient_count, status, review_note, scheduled_at, sent_at, cost_cents, created_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return NextResponse.json({ campaigns: data || [] });
  } catch (error) {
    logger.error('SMS campaign list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
