import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { data: merchant } = await supabase
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

    const { count: totalCustomers } = await supabase
      .from('loyalty_cards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: activeCustomers } = await supabase
      .from('loyalty_cards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: visitsThisMonth } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .gte('visited_at', firstDayOfMonth.toISOString());

    const { count: redemptionsThisMonth } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .gte('redeemed_at', firstDayOfMonth.toISOString());

    const visitsPerDay = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .gte('visited_at', `${dateStr}T00:00:00`)
        .lte('visited_at', `${dateStr}T23:59:59`);

      visitsPerDay.push({
        date: dateStr,
        count: count || 0,
      });
    }

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
