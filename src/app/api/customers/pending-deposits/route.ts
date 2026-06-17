import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import { getAllPhoneFormats, getTodayForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

/**
 * GET — Indique si la cliente authentifiee a au moins 1 acompte en attente
 * chez le merchant donne. Reservee pour usages futurs (toast, notification) ;
 * la vitrine /p/[slug] n'utilise plus cet endpoint car les liens y sont
 * permanents (Instagram in-app browser strip les cookies, perso impossible).
 *
 * Reponse : { hasPending: boolean }
 *
 * Auth : cookie qarte_cust requis. Si pas de cookie -> hasPending: false.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ hasPending: false });
  }

  const phone = getAuthenticatedPhone(request);
  if (!phone) {
    return NextResponse.json({ hasPending: false });
  }

  try {
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, merchants!inner(country)')
      .in('phone_number', getAllPhoneFormats(phone))
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ hasPending: false });
    }

    const merchantCountry = (customer as { merchants?: { country?: string } | { country?: string }[] }).merchants;
    const country = Array.isArray(merchantCountry) ? merchantCountry[0]?.country : merchantCountry?.country;
    const today = getTodayForCountry(country);

    const { count } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('customer_id', customer.id)
      .eq('deposit_confirmed', false)
      // RDV de suivi différé (avant J-7) : acompte pas encore dû → pas un acompte en attente.
      .not('deposit_deferred', 'is', true)
      .gte('slot_date', today)
      .not('client_name', 'is', null)
      .is('primary_slot_id', null);

    return NextResponse.json(
      { hasPending: (count || 0) > 0 },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch (err) {
    logger.error('pending-deposits error:', err);
    return NextResponse.json({ hasPending: false });
  }
}
