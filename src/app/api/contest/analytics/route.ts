import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { getTodayForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

/**
 * Compare le nombre de RDV confirmés du mois en cours vs la moyenne des 3
 * mois complets précédents. Sert de mesure ROI affichée dans la card hero
 * de la page contest.
 *
 * Retourne :
 *  - currentMonthBookings : RDV confirmés ce mois (mois partiel)
 *  - avgBaseline          : moyenne mensuelle des 3 mois complets précédents
 *  - boost                : currentMonthBookings − avgBaseline (peut être négatif)
 *  - hasBaseline          : false si moins de 3 mois d'historique → message neutre
 */
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
      .select('id, country, created_at')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const today = getTodayForCountry(merchant.country);
    const todayDate = new Date(today + 'T12:00:00');
    const currentMonthStart = today.slice(0, 7) + '-01';

    // 3 mois complets précédents (exclut mois courant)
    const baselineStartDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 3, 1);
    const baselineStart = baselineStartDate.toISOString().slice(0, 10);

    const [{ count: currentCount }, { count: baselineCount }] = await Promise.all([
      supabase
        .from('merchant_planning_slots')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .gte('slot_date', currentMonthStart)
        .not('customer_id', 'is', null)
        .is('primary_slot_id', null),
      supabase
        .from('merchant_planning_slots')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .gte('slot_date', baselineStart)
        .lt('slot_date', currentMonthStart)
        .not('customer_id', 'is', null)
        .is('primary_slot_id', null),
    ]);

    // Pas de baseline fiable si le merchant a moins de 3 mois d'historique
    const merchantAgeDays = Math.floor((todayDate.getTime() - new Date(merchant.created_at).getTime()) / 86400000);
    const hasBaseline = merchantAgeDays >= 90 && (baselineCount || 0) > 0;

    const avgBaseline = hasBaseline ? Math.round((baselineCount || 0) / 3) : 0;
    const boost = (currentCount || 0) - avgBaseline;

    return NextResponse.json({
      currentMonthBookings: currentCount || 0,
      avgBaseline,
      boost,
      hasBaseline,
    });
  } catch (error) {
    logger.error('Contest analytics GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
