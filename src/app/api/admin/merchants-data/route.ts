import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-merchants-data');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Paginate listUsers to get ALL users
    const allUsers: Array<{ id: string; email?: string }> = [];
    let usersPage = 1;
    let hasMoreUsers = true;
    while (hasMoreUsers) {
      const { data: { users: batch } } = await supabaseAdmin.auth.admin.listUsers({ page: usersPage, perPage: 1000 });
      allUsers.push(...batch);
      hasMoreUsers = batch.length === 1000;
      usersPage++;
    }

    // Fetch all data in parallel — RPCs for counts, direct queries for merchants/visits
    const [
      { data: merchants },
      { data: superAdmins },
      { data: visits },
      { data: loyaltyCards },
      { data: emailTracking },
      { data: reactivationTracking },
      { data: pendingVisitsRpc },
      { data: servicesRpc },
      { data: photosRpc },
      { data: vouchersRpc },
      { data: redemptionsRpc },
      { data: referralsRpc },
      { data: planningRpc },
    ] = await Promise.all([
      supabaseAdmin.from('merchants').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('super_admins').select('user_id'),
      supabaseAdmin.from('visits').select('merchant_id, visited_at').gte('visited_at', thirtyDaysAgo),
      supabaseAdmin.rpc('get_loyalty_card_counts_per_merchant'),
      supabaseAdmin.from('pending_email_tracking').select('merchant_id, reminder_day').limit(10000),
      supabaseAdmin.from('reactivation_email_tracking').select('merchant_id, day_sent').limit(10000),
      supabaseAdmin.rpc('get_pending_visits_per_merchant'),
      supabaseAdmin.rpc('get_counts_per_merchant', { p_table: 'merchant_services' }),
      supabaseAdmin.rpc('get_counts_per_merchant', { p_table: 'merchant_photos' }),
      supabaseAdmin.rpc('get_counts_per_merchant', { p_table: 'vouchers' }),
      supabaseAdmin.rpc('get_counts_per_merchant', { p_table: 'redemptions' }),
      supabaseAdmin.rpc('get_counts_per_merchant', { p_table: 'referrals' }),
      supabaseAdmin.rpc('get_planning_summary_per_merchant'),
    ]);

    const superAdminIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

    // Customer counts per merchant (from existing RPC)
    const customerCounts: Record<string, number> = {};
    (loyaltyCards || []).forEach((row: { merchant_id: string; card_count: number }) => {
      customerCounts[row.merchant_id] = Number(row.card_count);
    });

    // Visit aggregations (30 days only)
    const lastVisitDates: Record<string, string> = {};
    const todayScans: Record<string, number> = {};
    const weeklyScans: Record<string, number> = {};

    const nowParis = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const todayStart = new Date(nowParis.getFullYear(), nowParis.getMonth(), nowParis.getDate()).toISOString();
    const oneWeekAgo = new Date(nowParis.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    (visits || []).forEach((v: { merchant_id: string; visited_at: string }) => {
      if (!lastVisitDates[v.merchant_id] || v.visited_at > lastVisitDates[v.merchant_id]) {
        lastVisitDates[v.merchant_id] = v.visited_at;
      }
      if (v.visited_at >= todayStart) {
        todayScans[v.merchant_id] = (todayScans[v.merchant_id] || 0) + 1;
      }
      if (v.visited_at >= oneWeekAgo) {
        weeklyScans[v.merchant_id] = (weeklyScans[v.merchant_id] || 0) + 1;
      }
    });

    // Email tracking
    const emailTrackingMap: Record<string, number[]> = {};
    (emailTracking || []).forEach((e: { merchant_id: string; reminder_day: number }) => {
      if (!emailTrackingMap[e.merchant_id]) emailTrackingMap[e.merchant_id] = [];
      if (!emailTrackingMap[e.merchant_id].includes(e.reminder_day)) {
        emailTrackingMap[e.merchant_id].push(e.reminder_day);
      }
    });

    // Reactivation tracking
    const reactivationMap: Record<string, number[]> = {};
    (reactivationTracking || []).forEach((r: { merchant_id: string; day_sent: number }) => {
      if (!reactivationMap[r.merchant_id]) reactivationMap[r.merchant_id] = [];
      if (!reactivationMap[r.merchant_id].includes(r.day_sent)) {
        reactivationMap[r.merchant_id].push(r.day_sent);
      }
    });

    // RPC counts → Record<merchant_id, number>
    const toCountMap = (data: Array<{ merchant_id: string; cnt: number }> | null): Record<string, number> => {
      const map: Record<string, number> = {};
      (data || []).forEach(r => { map[r.merchant_id] = Number(r.cnt); });
      return map;
    };

    const pendingPoints = toCountMap(pendingVisitsRpc);
    const servicesCounts = toCountMap(servicesRpc);
    const photosCounts = toCountMap(photosRpc);
    const vouchersCounts = toCountMap(vouchersRpc);
    const redemptionsCounts = toCountMap(redemptionsRpc);
    const referralsCounts = toCountMap(referralsRpc);

    // Planning summary
    const slotsCounts: Record<string, number> = {};
    const bookingsCounts: Record<string, number> = {};
    const pendingDepositsCounts: Record<string, number> = {};
    (planningRpc || []).forEach((r: { merchant_id: string; total_slots: number; bookings: number; pending_deposits: number }) => {
      slotsCounts[r.merchant_id] = Number(r.total_slots);
      bookingsCounts[r.merchant_id] = Number(r.bookings);
      pendingDepositsCounts[r.merchant_id] = Number(r.pending_deposits);
    });

    // User emails
    const userEmails: Record<string, string> = {};
    allUsers.forEach((u) => {
      if (u.email) userEmails[u.id] = u.email;
    });

    return NextResponse.json({
      merchants: merchants || [],
      superAdminIds: Array.from(superAdminIds),
      customerCounts,
      lastVisitDates,
      todayScans,
      weeklyScans,
      emailTracking: emailTrackingMap,
      reactivationTracking: reactivationMap,
      pendingPoints,
      userEmails,
      servicesCounts,
      photosCounts,
      vouchersCounts,
      redemptionsCounts,
      referralsCounts,
      slotsCounts,
      bookingsCounts,
      pendingDepositsCounts,
    });
  } catch (error) {
    logger.error('Merchants data API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
