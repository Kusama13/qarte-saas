import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { getTodayForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, country')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const today = getTodayForCountry(merchant.country);
    const monthStart = today.slice(0, 7) + '-01';

    const { data: slots } = await supabase
      .from('merchant_planning_slots')
      .select('customer_id, client_name')
      .eq('merchant_id', merchantId)
      .gte('slot_date', monthStart)
      .not('client_name', 'is', null)
      .is('primary_slot_id', null)
      .not('customer_id', 'is', null);

    const seen = new Map<string, string>();
    for (const slot of slots || []) {
      if (slot.customer_id && !seen.has(slot.customer_id)) {
        seen.set(slot.customer_id, slot.client_name);
      }
    }

    return NextResponse.json({
      participants: seen.size,
      names: Array.from(seen.values()),
      month: today.slice(0, 7),
    });
  } catch (error) {
    logger.error('Contest participants GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
