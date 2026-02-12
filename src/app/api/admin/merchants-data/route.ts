import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-merchants-data:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    // Fetch all data in parallel (service_role bypasses RLS)
    const [
      { data: merchants },
      { data: superAdmins },
      { data: visits },
      { data: loyaltyCards },
      { data: emailTracking },
      { data: reactivationTracking },
      { data: pendingVisits },
      { data: { users } },
    ] = await Promise.all([
      supabaseAdmin.from('merchants').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('super_admins').select('user_id'),
      supabaseAdmin.from('visits').select('merchant_id, visited_at'),
      supabaseAdmin.from('loyalty_cards').select('merchant_id'),
      supabaseAdmin.from('pending_email_tracking').select('merchant_id, reminder_day'),
      supabaseAdmin.from('reactivation_email_tracking').select('merchant_id, day_sent'),
      supabaseAdmin.from('visits').select('merchant_id').eq('status', 'pending'),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    // Super admin user_ids
    const superAdminIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

    // Customer counts per merchant
    const customerCounts: Record<string, number> = {};
    (loyaltyCards || []).forEach((card: { merchant_id: string }) => {
      customerCounts[card.merchant_id] = (customerCounts[card.merchant_id] || 0) + 1;
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

    // User emails mapping
    const userEmails: Record<string, string> = {};
    (users || []).forEach((u) => {
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
    });
  } catch (error) {
    console.error('Merchants data API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
