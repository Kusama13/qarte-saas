import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-merchants-data');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    // Only load visits from last 30 days (C9 — was loading ALL visits)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Paginate listUsers to get ALL users (C10 — was capped at 1000)
    const allUsers: Array<{ id: string; email?: string }> = [];
    let usersPage = 1;
    let hasMoreUsers = true;
    while (hasMoreUsers) {
      const { data: { users: batch } } = await supabaseAdmin.auth.admin.listUsers({ page: usersPage, perPage: 1000 });
      allUsers.push(...batch);
      hasMoreUsers = batch.length === 1000;
      usersPage++;
    }

    // Fetch all data in parallel (service_role bypasses RLS)
    const [
      { data: merchants },
      { data: superAdmins },
      { data: visits },
      { data: loyaltyCards },
      { data: emailTracking },
      { data: reactivationTracking },
      { data: pendingVisits },
      { data: servicesList },
      { data: photosList },
    ] = await Promise.all([
      supabaseAdmin.from('merchants').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('super_admins').select('user_id'),
      supabaseAdmin.from('visits').select('merchant_id, visited_at').gte('visited_at', thirtyDaysAgo),
      supabaseAdmin.rpc('get_loyalty_card_counts_per_merchant'),
      supabaseAdmin.from('pending_email_tracking').select('merchant_id, reminder_day').limit(10000),
      supabaseAdmin.from('reactivation_email_tracking').select('merchant_id, day_sent').limit(10000),
      supabaseAdmin.from('visits').select('merchant_id').eq('status', 'pending').limit(10000),
      supabaseAdmin.from('merchant_services').select('merchant_id').limit(10000),
      supabaseAdmin.from('merchant_photos').select('merchant_id').limit(10000),
    ]);

    // Super admin user_ids
    const superAdminIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

    // Customer counts per merchant (from RPC aggregation)
    const customerCounts: Record<string, number> = {};
    (loyaltyCards || []).forEach((row: { merchant_id: string; card_count: number }) => {
      customerCounts[row.merchant_id] = Number(row.card_count);
    });

    // Visit aggregations
    const lastVisitDates: Record<string, string> = {};
    const todayScans: Record<string, number> = {};
    const weeklyScans: Record<string, number> = {};

    // Paris timezone: get start of today
    const nowParis = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const todayStart = new Date(nowParis.getFullYear(), nowParis.getMonth(), nowParis.getDate()).toISOString();
    const oneWeekAgo = new Date(nowParis.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    (visits || []).forEach((v: { merchant_id: string; visited_at: string }) => {
      // Last visit
      if (!lastVisitDates[v.merchant_id] || v.visited_at > lastVisitDates[v.merchant_id]) {
        lastVisitDates[v.merchant_id] = v.visited_at;
      }
      // Today scans
      if (v.visited_at >= todayStart) {
        todayScans[v.merchant_id] = (todayScans[v.merchant_id] || 0) + 1;
      }
      // Weekly scans
      if (v.visited_at >= oneWeekAgo) {
        weeklyScans[v.merchant_id] = (weeklyScans[v.merchant_id] || 0) + 1;
      }
    });

    // Email tracking: milestone codes per merchant
    const emailTrackingMap: Record<string, number[]> = {};
    (emailTracking || []).forEach((e: { merchant_id: string; reminder_day: number }) => {
      if (!emailTrackingMap[e.merchant_id]) emailTrackingMap[e.merchant_id] = [];
      if (!emailTrackingMap[e.merchant_id].includes(e.reminder_day)) {
        emailTrackingMap[e.merchant_id].push(e.reminder_day);
      }
    });

    // Reactivation tracking per merchant
    const reactivationMap: Record<string, number[]> = {};
    (reactivationTracking || []).forEach((r: { merchant_id: string; day_sent: number }) => {
      if (!reactivationMap[r.merchant_id]) reactivationMap[r.merchant_id] = [];
      if (!reactivationMap[r.merchant_id].includes(r.day_sent)) {
        reactivationMap[r.merchant_id].push(r.day_sent);
      }
    });

    // Pending points per merchant (shield)
    const pendingPoints: Record<string, number> = {};
    (pendingVisits || []).forEach((v: { merchant_id: string }) => {
      pendingPoints[v.merchant_id] = (pendingPoints[v.merchant_id] || 0) + 1;
    });

    // Services counts per merchant
    const servicesCounts: Record<string, number> = {};
    (servicesList || []).forEach((s: { merchant_id: string }) => {
      servicesCounts[s.merchant_id] = (servicesCounts[s.merchant_id] || 0) + 1;
    });

    // Photos counts per merchant
    const photosCounts: Record<string, number> = {};
    (photosList || []).forEach((p: { merchant_id: string }) => {
      photosCounts[p.merchant_id] = (photosCounts[p.merchant_id] || 0) + 1;
    });

    // User emails mapping (uses paginated allUsers from C10 fix)
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
    });
  } catch (error) {
    logger.error('Merchants data API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
