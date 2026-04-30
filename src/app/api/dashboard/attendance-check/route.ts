import { NextRequest, NextResponse } from 'next/server';
import { authorizeMerchant } from '@/lib/api-helpers';
import { getTodayForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

interface YesterdayBooking {
  id: string;
  client_name: string | null;
  start_time: string;
  attendance_status: string | null;
}

/**
 * GET — Récupère les RDV d'hier + dernier dismiss pour décider d'afficher le prompt.
 * Retour : { showPrompt: boolean, bookings: YesterdayBooking[] }
 *
 * showPrompt = true si :
 *   - hier avait ≥1 booking confirmé (client_name set, pas blocked, pas filler)
 *   - ET (last_attendance_check_at est NULL OU < startOfTodayLocal)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
  }

  const auth = await authorizeMerchant(merchantId);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('country, last_attendance_check_at')
      .eq('id', merchantId)
      .maybeSingle();

    const today = getTodayForCountry(merchant?.country);
    const yesterday = new Date(today + 'T00:00:00Z');
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const { data: bookings } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, client_name, start_time, attendance_status')
      .eq('merchant_id', merchantId)
      .eq('slot_date', yesterdayStr)
      .not('client_name', 'is', null)
      .neq('client_name', '__blocked__')
      .is('primary_slot_id', null)
      .order('start_time', { ascending: true });

    const list = (bookings || []) as YesterdayBooking[];

    // Le prompt s'affiche si hier > 0 résas ET pas dismissé aujourd'hui
    const lastCheck = merchant?.last_attendance_check_at;
    const startOfToday = new Date(today + 'T00:00:00Z');
    const dismissedToday = lastCheck && new Date(lastCheck) >= startOfToday;
    const showPrompt = list.length > 0 && !dismissedToday;

    return NextResponse.json(
      { showPrompt, bookings: list },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch (err) {
    logger.error('attendance check GET error:', err);
    return NextResponse.json({ showPrompt: false, bookings: [] });
  }
}

/**
 * POST — Dismiss le soft-prompt "Hier tu as eu N résas. Tout le monde est venu ?"
 * Set merchants.last_attendance_check_at = NOW() pour ne pas reprompt aujourd'hui.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get('merchantId');
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
  }

  const auth = await authorizeMerchant(merchantId);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { error } = await supabaseAdmin
    .from('merchants')
    .update({ last_attendance_check_at: new Date().toISOString() })
    .eq('id', merchantId);

  if (error) {
    logger.error('attendance dismiss error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
