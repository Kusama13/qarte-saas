import { NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { getTodayForCountry, getTodayStartForCountry } from '@/lib/utils';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, country')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerçant introuvable' },
        { status: 404 }
      );
    }

    const merchantCountry = merchant.country;
    const todayStr = getTodayForCountry(merchantCountry);
    const todayDate = new Date(todayStr);

    const thirtyDaysAgoDate = new Date(todayDate);
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgoDate.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0] + 'T00:00:00.000Z';

    // Run all independent queries in parallel
    const [
      { count: totalCustomers },
      { count: activeCustomers },
      { count: visitsThisMonth },
      { count: redemptionsThisMonth },
      { data: visitsLast30Days }
    ] = await Promise.all([
      // Total customers
      supabaseAdmin
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id),

      // Active customers (visited in last 30 days)
      supabaseAdmin
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .gte('last_visit_date', thirtyDaysAgoDate.toISOString().split('T')[0]),

      // Visits this month
      supabaseAdmin
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .gte('visited_at', firstDayOfMonthStr),

      // Redemptions this month
      supabaseAdmin
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .gte('redeemed_at', firstDayOfMonthStr),

      // All visits in last 30 days (single query instead of 30!)
      supabaseAdmin
        .from('visits')
        .select('visited_at')
        .eq('merchant_id', merchant.id)
        .gte('visited_at', thirtyDaysAgoStr)
    ]);

    // Group visits by day in JavaScript (much faster than 30 DB queries)
    const visitCountsByDate: Record<string, number> = {};

    // Initialize all 30 days with 0 (using merchant's local date)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(todayDate);
      date.setDate(todayDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      visitCountsByDate[dateStr] = 0;
    }

    // Count visits per day
    if (visitsLast30Days) {
      for (const visit of visitsLast30Days) {
        const dateStr = visit.visited_at.split('T')[0];
        if (visitCountsByDate[dateStr] !== undefined) {
          visitCountsByDate[dateStr]++;
        }
      }
    }

    // Convert to array format
    const visitsPerDay = Object.entries(visitCountsByDate).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      activeCustomers: activeCustomers || 0,
      visitsThisMonth: visitsThisMonth || 0,
      redemptionsThisMonth: redemptionsThisMonth || 0,
      visitsPerDay,
    });
  } catch (error) {
    logger.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
