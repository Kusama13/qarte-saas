import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseAdmin = getSupabaseAdmin();

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerçant introuvable' },
        { status: 404 }
      );
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString();

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
        .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]),

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

    // Initialize all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
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
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
