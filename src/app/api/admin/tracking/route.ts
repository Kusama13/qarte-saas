import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-tracking');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const now = new Date();
    const d90 = new Date(now.getTime() - 90 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d90Date = d90.split('T')[0];

    const [
      merchantsRes,
      superAdminsRes,
      visitsRes,
      cardsRes,
      totalCustomersRes,
      pushHistoryRes,
      pushAutomationsRes,
      pendingEmailsRes,
      reactivationRes,
      referralsRes,
      slotsRes,
      offersRes,
      vouchersRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('merchants')
        .select('id, signup_source, first_feature_choice, created_at, subscription_status, trial_ends_at, user_id, referral_program_enabled, birthday_gift_enabled, welcome_offer_enabled, double_days_enabled, planning_enabled, shield_enabled, tier2_enabled, pwa_installed_at, logo_url, review_link, booking_url, shop_name'),
      supabaseAdmin.from('super_admins').select('user_id'),
      supabaseAdmin
        .from('visits')
        .select('merchant_id, visited_at')
        .gte('visited_at', d90),
      supabaseAdmin
        .from('loyalty_cards')
        .select('created_at')
        .gte('created_at', d90),
      supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('push_history')
        .select('sent_count, failed_count'),
      supabaseAdmin
        .from('push_automations')
        .select('welcome_sent, close_to_reward_sent, reward_ready_sent, inactive_reminder_sent, reward_reminder_sent, events_sent'),
      supabaseAdmin
        .from('pending_email_tracking')
        .select('reminder_day'),
      supabaseAdmin
        .from('reactivation_email_tracking')
        .select('day_sent'),
      supabaseAdmin
        .from('referrals')
        .select('status'),
      supabaseAdmin
        .from('merchant_planning_slots')
        .select('client_name')
        .gte('slot_date', d90Date),
      supabaseAdmin
        .from('merchant_offers')
        .select('active, claim_count'),
      supabaseAdmin
        .from('vouchers')
        .select('source'),
    ]);

    // Check for critical query errors
    const queryErrors = [
      merchantsRes.error && 'merchants',
      visitsRes.error && 'visits',
      superAdminsRes.error && 'super_admins',
    ].filter(Boolean);
    if (queryErrors.length > 0) {
      console.error('[admin/tracking] Query errors:', queryErrors);
      return NextResponse.json({ error: `Query failed: ${queryErrors.join(', ')}` }, { status: 500 });
    }

    // Filter super admins
    const adminIds = new Set((superAdminsRes.data || []).map((a) => a.user_id));
    const merchants = (merchantsRes.data || []).filter((m) => !adminIds.has(m.user_id));
    const merchantMap = new Map(merchants.map((m) => [m.id, m]));
    const visits = visitsRes.data || [];
    const cards = cardsRes.data || [];

    // ── Section 1: Signup Funnel + Section 3: Feature Adoption (single pass) ──
    const bySource: Record<string, number> = {};
    const byFeatureChoice: Record<string, number> = {};
    const signupByDate: Record<string, number> = {};
    let trialActive = 0;
    let converted = 0;
    let canceled = 0;
    let expired = 0;

    // Feature counters
    const fc_counts = { logo: 0, referral: 0, birthday: 0, welcome: 0, doubleDays: 0, planning: 0, shield: 0, tier2: 0, pwa: 0, review: 0, booking: 0 };

    for (const m of merchants) {
      const src = m.signup_source || 'direct';
      bySource[src] = (bySource[src] || 0) + 1;

      const fc = m.first_feature_choice || 'non choisi';
      byFeatureChoice[fc] = (byFeatureChoice[fc] || 0) + 1;

      const date = m.created_at?.split('T')[0];
      if (date) signupByDate[date] = (signupByDate[date] || 0) + 1;

      const s = m.subscription_status;
      if (s === 'active') converted++;
      else if (s === 'canceled') canceled++;
      else if (s === 'trialing') {
        const end = m.trial_ends_at ? new Date(m.trial_ends_at) : null;
        if (end && end < now) expired++;
        else trialActive++;
      } else if (s === 'expired') expired++;

      // Feature adoption (single pass)
      if (m.logo_url) fc_counts.logo++;
      if (m.referral_program_enabled) fc_counts.referral++;
      if (m.birthday_gift_enabled) fc_counts.birthday++;
      if (m.welcome_offer_enabled) fc_counts.welcome++;
      if (m.double_days_enabled) fc_counts.doubleDays++;
      if (m.planning_enabled) fc_counts.planning++;
      if (m.shield_enabled) fc_counts.shield++;
      if (m.tier2_enabled) fc_counts.tier2++;
      if (m.pwa_installed_at) fc_counts.pwa++;
      if (m.review_link) fc_counts.review++;
      if (m.booking_url) fc_counts.booking++;
    }

    // ── Section 2: Engagement ──
    const merchantScans: Record<string, number> = {};
    const scansByDate: Record<string, number> = {};
    const active7dSet = new Set<string>();
    const active30dSet = new Set<string>();
    let scansLast30 = 0;

    for (const v of visits) {
      const date = v.visited_at?.split('T')[0];
      if (date) scansByDate[date] = (scansByDate[date] || 0) + 1;
      merchantScans[v.merchant_id] = (merchantScans[v.merchant_id] || 0) + 1;
      if (v.visited_at >= d7) active7dSet.add(v.merchant_id);
      if (v.visited_at >= d30) { active30dSet.add(v.merchant_id); scansLast30++; }
    }

    const avgScansPerWeek = Math.round((scansLast30 / 4.3) * 10) / 10;

    const top10 = Object.entries(merchantScans)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, scans]) => ({
        id,
        shopName: merchantMap.get(id)?.shop_name || '?',
        scans,
      }));

    // ── Section 3: Feature Adoption ──
    const total = merchants.length;
    const mkF = (label: string, count: number) => ({ label, count, total, pct: total > 0 ? Math.round((count / total) * 100) : 0 });
    const featureAdoption = [
      mkF('Logo', fc_counts.logo),
      mkF('Parrainage', fc_counts.referral),
      mkF('Anniversaire', fc_counts.birthday),
      mkF('Offre bienvenue', fc_counts.welcome),
      mkF('Jours doubles', fc_counts.doubleDays),
      mkF('Planning', fc_counts.planning),
      mkF('Qarte Shield', fc_counts.shield),
      mkF('Tier 2', fc_counts.tier2),
      mkF('PWA', fc_counts.pwa),
      mkF('Avis Google', fc_counts.review),
      mkF('Booking', fc_counts.booking),
    ];

    // ── Section 4: Push & Email ──
    const manualPushSent = (pushHistoryRes.data || []).reduce((s, p) => s + (p.sent_count || 0), 0);
    const automations = pushAutomationsRes.data || [];
    const automationBreakdown = [
      { type: 'Bienvenue', count: automations.reduce((s, a) => s + (a.welcome_sent || 0), 0) },
      { type: 'Proche recompense', count: automations.reduce((s, a) => s + (a.close_to_reward_sent || 0), 0) },
      { type: 'Recompense prete', count: automations.reduce((s, a) => s + (a.reward_ready_sent || 0), 0) },
      { type: 'Relance inactif', count: automations.reduce((s, a) => s + (a.inactive_reminder_sent || 0), 0) },
      { type: 'Rappel recompense', count: automations.reduce((s, a) => s + (a.reward_reminder_sent || 0), 0) },
      { type: 'Evenements', count: automations.reduce((s, a) => s + (a.events_sent || 0), 0) },
    ];

    const pendingEmailsByDay: Record<number, number> = {};
    for (const e of pendingEmailsRes.data || []) {
      pendingEmailsByDay[e.reminder_day] = (pendingEmailsByDay[e.reminder_day] || 0) + 1;
    }
    const reactivationByDay: Record<number, number> = {};
    for (const e of reactivationRes.data || []) {
      reactivationByDay[e.day_sent] = (reactivationByDay[e.day_sent] || 0) + 1;
    }

    // ── Section 5: Booking & Offers ──
    const slots = slotsRes.data || [];
    const slotsCreated = slots.length;
    const slotsBooked = slots.filter((s) => s.client_name !== null).length;
    const offers = offersRes.data || [];
    const activeOffers = offers.filter((o) => o.active).length;
    const totalClaims = offers.reduce((s, o) => s + (o.claim_count || 0), 0);

    // ── Section 6: Customer Growth ──
    const newByDate: Record<string, number> = {};
    for (const c of cards) {
      const date = c.created_at?.split('T')[0];
      if (date) newByDate[date] = (newByDate[date] || 0) + 1;
    }

    const referrals = referralsRes.data || [];
    const vouchersBySource: Record<string, number> = {};
    for (const v of vouchersRes.data || []) {
      const src = v.source || 'autre';
      vouchersBySource[src] = (vouchersBySource[src] || 0) + 1;
    }

    // Helper: record to sorted array
    const toTrend = (rec: Record<string, number>) =>
      Object.entries(rec)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const toArray = (rec: Record<string | number, number>, keyName = 'source') =>
      Object.entries(rec)
        .map(([k, count]) => ({ [keyName]: k, count }))
        .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      signupFunnel: {
        bySource: toArray(bySource),
        byFeatureChoice: toArray(byFeatureChoice, 'choice'),
        signupTrend: toTrend(signupByDate),
        funnel: { total: merchants.length, trialActive, converted, canceled, expired },
      },
      engagement: {
        active7d: active7dSet.size,
        active30d: active30dSet.size,
        scansTrend: toTrend(scansByDate).filter((d) => d.date >= d30.split('T')[0]),
        avgScansPerWeek,
        top10,
      },
      featureAdoption,
      pushEmail: {
        manualPushSent,
        automationBreakdown,
        pendingEmailsByDay: toArray(pendingEmailsByDay, 'day'),
        reactivationByDay: toArray(reactivationByDay, 'day'),
      },
      bookingOffers: {
        slotsCreated,
        slotsBooked,
        conversionRate: slotsCreated > 0 ? Math.round((slotsBooked / slotsCreated) * 100) : 0,
        activeOffers,
        totalClaims,
      },
      customerGrowth: {
        total: totalCustomersRes.count || 0,
        newCustomersTrend: toTrend(newByDate).filter((d) => d.date >= d30.split('T')[0]),
        referrals: {
          total: referrals.length,
          pending: referrals.filter((r) => r.status === 'pending').length,
          completed: referrals.filter((r) => r.status === 'completed').length,
        },
        vouchersBySource: toArray(vouchersBySource),
      },
    });
  } catch (err) {
    console.error('[admin/tracking]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
