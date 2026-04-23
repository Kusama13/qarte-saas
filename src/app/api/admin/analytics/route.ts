/**
 * Analytics admin — API consolidée (remplace /api/admin/tracking + metriques).
 * Retourne 6 sections correspondant aux 6 onglets de /admin/analytics :
 * Revenue, Funnel, Activation, Engagement, Automations, Growth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getMerchantMonthlyPrice } from '@/lib/utils';
import { PAID_STATUSES } from '@/lib/sms';

interface MerchantRow {
  id: string;
  user_id: string;
  shop_name: string;
  signup_source: string | null;
  created_at: string;
  subscription_status: string;
  plan_tier: string | null;
  billing_interval: string | null;
  billing_period_start: string | null;
  trial_ends_at: string | null;
  referral_program_enabled: boolean;
  birthday_gift_enabled: boolean;
  welcome_offer_enabled: boolean;
  double_days_enabled: boolean;
  planning_enabled: boolean;
  auto_booking_enabled: boolean;
  shield_enabled: boolean;
  tier2_enabled: boolean;
  pwa_installed_at: string | null;
  logo_url: string | null;
  review_link: string | null;
  booking_url: string | null;
  loyalty_mode: string | null;
  booking_mode: string | null;
}

const PAID_STATUS_SET: ReadonlySet<string> = new Set(PAID_STATUSES);

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-analytics');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const now = new Date();
    const d90 = new Date(now.getTime() - 90 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d90Date = d90.split('T')[0];
    const d30Date = d30.split('T')[0];

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
      servicesRes,
      photosRes,
      firstVisitsRes,
      tenthCardsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from('merchants')
        .select('id, user_id, shop_name, signup_source, created_at, subscription_status, plan_tier, billing_interval, billing_period_start, trial_ends_at, referral_program_enabled, birthday_gift_enabled, welcome_offer_enabled, double_days_enabled, planning_enabled, auto_booking_enabled, shield_enabled, tier2_enabled, pwa_installed_at, logo_url, review_link, booking_url, loyalty_mode, booking_mode'),
      supabaseAdmin.from('super_admins').select('user_id'),
      supabaseAdmin.from('visits').select('merchant_id, visited_at').gte('visited_at', d90),
      supabaseAdmin.from('loyalty_cards').select('created_at').gte('created_at', d90),
      supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('push_history').select('sent_count'),
      supabaseAdmin.from('push_automations').select('welcome_sent, close_to_reward_sent, reward_ready_sent, inactive_reminder_sent, reward_reminder_sent, events_sent'),
      supabaseAdmin.from('pending_email_tracking').select('reminder_day'),
      supabaseAdmin.from('reactivation_email_tracking').select('day_sent'),
      supabaseAdmin.from('referrals').select('status'),
      supabaseAdmin.from('merchant_planning_slots').select('client_name').gte('slot_date', d90Date),
      supabaseAdmin.from('merchant_offers').select('active, claim_count'),
      supabaseAdmin.from('vouchers').select('source'),
      supabaseAdmin.from('merchant_services').select('merchant_id'),
      supabaseAdmin.from('merchant_photos').select('merchant_id'),
      supabaseAdmin.rpc('get_first_visit_per_merchant'),
      supabaseAdmin.rpc('get_tenth_card_date_per_merchant'),
    ]);

    if (merchantsRes.error) {
      return NextResponse.json({ error: `Merchants query failed: ${merchantsRes.error.message}` }, { status: 500 });
    }

    const adminIds = new Set((superAdminsRes.data || []).map((a) => a.user_id));
    const merchants = ((merchantsRes.data || []) as MerchantRow[]).filter((m) => !adminIds.has(m.user_id));
    const merchantMap = new Map(merchants.map((m) => [m.id, m]));
    const visits = visitsRes.data || [];
    const cards = cardsRes.data || [];

    const isPaid = (s: string) => PAID_STATUS_SET.has(s);

    // ── Aggregations (single pass over merchants) ──
    const bySource: Record<string, number> = {};
    const signupByDate: Record<string, number> = {};
    const tierBreakdown = { fidelity: 0, all_in: 0 };
    const fc_counts = { logo: 0, referral: 0, birthday: 0, welcome: 0, doubleDays: 0, planning: 0, autoBooking: 0, shield: 0, tier2: 0, pwa: 0, review: 0, booking: 0, services: 0, photos: 0, cagnotte: 0, modeSlots: 0, modeFree: 0 };
    const merchantsWithServices = new Set((servicesRes.data || []).map((s: { merchant_id: string }) => s.merchant_id));
    const merchantsWithPhotos = new Set((photosRes.data || []).map((p: { merchant_id: string }) => p.merchant_id));

    let trialActive = 0, paid = 0, canceled = 0, expired = 0;
    let mrrCents = 0, monthlyMrrCents = 0, annualMrrCents = 0;
    let monthlyCount = 0, annualCount = 0;

    for (const m of merchants) {
      bySource[m.signup_source || 'direct'] = (bySource[m.signup_source || 'direct'] || 0) + 1;
      const date = m.created_at?.split('T')[0];
      if (date) signupByDate[date] = (signupByDate[date] || 0) + 1;

      const s = m.subscription_status;
      if (isPaid(s)) {
        paid++;
        const tier = m.plan_tier === 'fidelity' ? 'fidelity' : 'all_in';
        tierBreakdown[tier]++;
        const priceCents = Math.round(getMerchantMonthlyPrice(m) * 100);
        mrrCents += priceCents;
        if (m.billing_interval === 'annual') { annualMrrCents += priceCents; annualCount++; }
        else { monthlyMrrCents += priceCents; monthlyCount++; }
      } else if (s === 'canceled') canceled++;
      else if (s === 'trial') {
        const end = m.trial_ends_at ? new Date(m.trial_ends_at) : null;
        if (end && end < now) expired++;
        else trialActive++;
      }

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
      if (m.auto_booking_enabled) fc_counts.autoBooking++;
      if (m.loyalty_mode === 'cagnotte') fc_counts.cagnotte++;
      if (m.booking_mode === 'slots') fc_counts.modeSlots++;
      if (m.booking_mode === 'free') fc_counts.modeFree++;
      if (merchantsWithServices.has(m.id)) fc_counts.services++;
      if (merchantsWithPhotos.has(m.id)) fc_counts.photos++;
    }

    const churnRate = (paid + canceled) > 0 ? Math.round((canceled / (paid + canceled)) * 100) : 0;

    // ── Trial-to-paid rate (last 30 days) + avg time to convert ──
    const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);
    const trialEndedRecently = merchants.filter((m) => {
      if (!m.trial_ends_at) return false;
      const te = new Date(m.trial_ends_at);
      return te < now && te >= oneMonthAgo;
    });
    const trialConvertedCount = trialEndedRecently.filter((m) => isPaid(m.subscription_status)).length;
    const trialToPaidRate = trialEndedRecently.length > 0 ? Math.round((trialConvertedCount / trialEndedRecently.length) * 100) : 0;

    let totalConvertDays = 0, convertCount = 0;
    for (const m of merchants) {
      if (!isPaid(m.subscription_status) || !m.trial_ends_at) continue;
      const days = (new Date(m.trial_ends_at).getTime() - new Date(m.created_at).getTime()) / 86400000;
      if (days > 0) { totalConvertDays += days; convertCount++; }
    }
    const avgTimeToConvert = convertCount > 0 ? Math.round((totalConvertDays / convertCount) * 10) / 10 : 0;

    // ── Activation ──
    const firstVisitMap = new Map<string, Date>();
    for (const row of (firstVisitsRes.data || []) as { merchant_id: string; first_visit_date: string }[]) {
      firstVisitMap.set(row.merchant_id, new Date(row.first_visit_date));
    }
    const tenthCardMap = new Map<string, Date>();
    for (const row of (tenthCardsRes.data || []) as { merchant_id: string; tenth_card_date: string }[]) {
      tenthCardMap.set(row.merchant_id, new Date(row.tenth_card_date));
    }

    const recent = merchants.filter((m) => new Date(m.created_at) >= oneMonthAgo);
    const recentActivated = recent.filter((m) => firstVisitMap.has(m.id));
    const activationRate = recent.length > 0 ? Math.round((recentActivated.length / recent.length) * 100) : 0;

    let firstScanDaysSum = 0, firstScanCount = 0;
    for (const m of merchants) {
      const fv = firstVisitMap.get(m.id);
      if (!fv) continue;
      const days = (fv.getTime() - new Date(m.created_at).getTime()) / 86400000;
      if (days >= 0) { firstScanDaysSum += days; firstScanCount++; }
    }
    const avgTimeToFirstScan = firstScanCount > 0 ? Math.round((firstScanDaysSum / firstScanCount) * 10) / 10 : 0;

    let tenthDaysSum = 0, tenthCount = 0;
    for (const m of merchants) {
      const t10 = tenthCardMap.get(m.id);
      if (!t10) continue;
      const days = (t10.getTime() - new Date(m.created_at).getTime()) / 86400000;
      if (days >= 0) { tenthDaysSum += days; tenthCount++; }
    }
    const avgTimeTo10Customers = tenthCount > 0 ? Math.round((tenthDaysSum / tenthCount) * 10) / 10 : 0;

    // ── Engagement ──
    const merchantScans: Record<string, number> = {};
    const scansByDate: Record<string, number> = {};
    const active7d = new Set<string>();
    const active30d = new Set<string>();
    let scansLast30 = 0;
    for (const v of visits) {
      const date = v.visited_at?.split('T')[0];
      if (date) scansByDate[date] = (scansByDate[date] || 0) + 1;
      merchantScans[v.merchant_id] = (merchantScans[v.merchant_id] || 0) + 1;
      if (v.visited_at >= d7) active7d.add(v.merchant_id);
      if (v.visited_at >= d30) { active30d.add(v.merchant_id); scansLast30++; }
    }
    const avgScansPerWeek = Math.round((scansLast30 / 4.3) * 10) / 10;
    const top10 = Object.entries(merchantScans)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, scans]) => ({ id, shopName: merchantMap.get(id)?.shop_name || '?', scans }));

    // ── Feature adoption ──
    const total = merchants.length;
    const mkF = (label: string, count: number) => ({ label, count, total, pct: total > 0 ? Math.round((count / total) * 100) : 0 });
    const featureAdoption = [
      mkF('Logo', fc_counts.logo),
      mkF('Parrainage', fc_counts.referral),
      mkF('Anniversaire', fc_counts.birthday),
      mkF('Offre nouveaux clients', fc_counts.welcome),
      mkF('Jours doubles', fc_counts.doubleDays),
      mkF('Planning', fc_counts.planning),
      mkF('Qarte Shield', fc_counts.shield),
      mkF('Tier 2', fc_counts.tier2),
      mkF('PWA', fc_counts.pwa),
      mkF('Avis Google', fc_counts.review),
      mkF('Booking URL', fc_counts.booking),
      mkF('Résa en ligne', fc_counts.autoBooking),
      mkF('Prestations', fc_counts.services),
      mkF('Photos', fc_counts.photos),
      mkF('Mode cagnotte', fc_counts.cagnotte),
      mkF('Planning créneaux', fc_counts.modeSlots),
      mkF('Planning libre', fc_counts.modeFree),
    ];

    // ── Automations ──
    const manualPushSent = (pushHistoryRes.data || []).reduce((s, p) => s + (p.sent_count || 0), 0);
    const autoTotals = { welcome: 0, closeToReward: 0, rewardReady: 0, inactive: 0, rewardReminder: 0, events: 0 };
    for (const a of pushAutomationsRes.data || []) {
      autoTotals.welcome += a.welcome_sent || 0;
      autoTotals.closeToReward += a.close_to_reward_sent || 0;
      autoTotals.rewardReady += a.reward_ready_sent || 0;
      autoTotals.inactive += a.inactive_reminder_sent || 0;
      autoTotals.rewardReminder += a.reward_reminder_sent || 0;
      autoTotals.events += a.events_sent || 0;
    }
    const automationBreakdown = [
      { type: 'Nouveaux clients', count: autoTotals.welcome },
      { type: 'Proche récompense', count: autoTotals.closeToReward },
      { type: 'Récompense prête', count: autoTotals.rewardReady },
      { type: 'Relance inactif', count: autoTotals.inactive },
      { type: 'Rappel récompense', count: autoTotals.rewardReminder },
      { type: 'Événements', count: autoTotals.events },
    ];
    const pendingEmailsByDay: Record<number, number> = {};
    for (const e of pendingEmailsRes.data || []) pendingEmailsByDay[e.reminder_day] = (pendingEmailsByDay[e.reminder_day] || 0) + 1;
    const reactivationByDay: Record<number, number> = {};
    for (const e of reactivationRes.data || []) reactivationByDay[e.day_sent] = (reactivationByDay[e.day_sent] || 0) + 1;

    // ── Booking & Offers ──
    const slots = slotsRes.data || [];
    const slotsCreated = slots.length;
    const slotsBooked = slots.filter((s) => s.client_name !== null).length;
    const offers = offersRes.data || [];
    const activeOffers = offers.filter((o) => o.active).length;
    const totalClaims = offers.reduce((s, o) => s + (o.claim_count || 0), 0);

    // ── Customer growth ──
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

    // ── Nouveaux abonnés payants par mois (12 derniers mois) ──
    // Proxy date conversion = trial_ends_at (trial 7j → ≈ date 1ère facture).
    // Inclut les canceled (ils ont payé à un moment donné).
    const newPaidByMonth: { month: string; count: number; monthKey: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      newPaidByMonth.push({
        monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        count: 0,
      });
    }
    const keyIndex = new Map(newPaidByMonth.map((m, i) => [m.monthKey, i]));
    for (const m of merchants) {
      if (!m.trial_ends_at) continue;
      const s = m.subscription_status;
      if (s !== 'active' && s !== 'canceling' && s !== 'past_due' && s !== 'canceled') continue;
      const d = new Date(m.trial_ends_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = keyIndex.get(key);
      if (idx !== undefined) newPaidByMonth[idx].count++;
    }

    type DayBreakdown = { date: string; label: string; signups: number; trials: number; paid: number };
    type WeeklyCohort = { key: string; label: string; signups: number; trials: number; paid: number; conversionRate: number; dailyBreakdown: DayBreakdown[] };
    const cohortsArr: WeeklyCohort[] = [];
    // Pre-cache timestamps once — avoids repeated new Date() inside filter loops
    const createdAtMs = new Map(merchants.map((m) => [m.id, new Date(m.created_at).getTime()]));
    const earliestMs = merchants.reduce((min, m) => Math.min(min, createdAtMs.get(m.id)!), Infinity);
    if (isFinite(earliestMs)) {
      const windowStart = new Date(earliestMs);
      windowStart.setHours(0, 0, 0, 0);
      while (windowStart < now) {
        const windowEnd = new Date(windowStart);
        windowEnd.setDate(windowEnd.getDate() + 7);
        const wsMs = windowStart.getTime();
        const weMs = windowEnd.getTime();
        const cohortM = merchants.filter((m) => {
          const t = createdAtMs.get(m.id)!;
          return t >= wsMs && t < weMs;
        });
        if (cohortM.length > 0) {
          // Single pass over cohortM for all counts
          let paidCount = 0, trialCount = 0;
          for (const m of cohortM) {
            if (isPaid(m.subscription_status)) paidCount++;
            else if (m.subscription_status === 'trial') trialCount++;
          }
          const daily: DayBreakdown[] = [];
          for (let d = 0; d < 7; d++) {
            const dayStart = new Date(windowStart);
            dayStart.setDate(dayStart.getDate() + d);
            if (dayStart > now) break;
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            const dsMs = dayStart.getTime();
            const deMs = dayEnd.getTime();
            let dSignups = 0, dTrials = 0, dPaid = 0;
            for (const m of cohortM) {
              const t = createdAtMs.get(m.id)!;
              if (t >= dsMs && t < deMs) {
                dSignups++;
                if (isPaid(m.subscription_status)) dPaid++;
                else if (m.subscription_status === 'trial') dTrials++;
              }
            }
            if (dSignups > 0) {
              daily.push({
                date: dayStart.toISOString().split('T')[0],
                label: dayStart.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
                signups: dSignups,
                trials: dTrials,
                paid: dPaid,
              });
            }
          }
          cohortsArr.push({
            key: windowStart.toISOString().split('T')[0],
            label: `${windowStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${new Date(weMs - 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
            signups: cohortM.length,
            trials: trialCount,
            paid: paidCount,
            conversionRate: Math.round((paidCount / cohortM.length) * 100),
            dailyBreakdown: daily,
          });
        }
        windowStart.setDate(windowStart.getDate() + 7);
      }
      cohortsArr.reverse();
    }

    // ── Helpers ──
    const toTrend = (rec: Record<string, number>) =>
      Object.entries(rec).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    const toArray = (rec: Record<string | number, number>, keyName = 'source') =>
      Object.entries(rec).map(([k, count]) => ({ [keyName]: k, count })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      revenue: {
        mrr: Math.round(mrrCents / 100),
        monthlyMrr: Math.round(monthlyMrrCents / 100),
        annualMrr: Math.round(annualMrrCents / 100),
        monthlyCount,
        annualCount,
        paid,
        churnRate,
        churned: canceled,
        newPaidByMonth: newPaidByMonth.map(({ month, count }) => ({ month, count })),
        tierMix: tierBreakdown,
        arpu: paid > 0 ? Math.round((mrrCents / 100) / paid) : 0,
      },
      funnel: {
        total: merchants.length,
        trialActive,
        paid,
        canceled,
        expired,
        trialToPaidRate,
        trialEnded30d: trialEndedRecently.length,
        trialConverted30d: trialConvertedCount,
        avgTimeToConvert,
        bySource: toArray(bySource),
        signupTrend: toTrend(signupByDate),
        cohorts: cohortsArr,
      },
      activation: {
        activationRate,
        recentMerchantCount: recent.length,
        recentActivatedCount: recentActivated.length,
        avgTimeToFirstScan,
        avgTimeTo10Customers,
        featureAdoption,
      },
      engagement: {
        active7d: active7d.size,
        active30d: active30d.size,
        avgScansPerWeek,
        scansTrend: toTrend(scansByDate).filter((d) => d.date >= d30Date),
        top10,
      },
      automations: {
        manualPushSent,
        automationBreakdown,
        pendingEmailsByDay: toArray(pendingEmailsByDay, 'day'),
        reactivationByDay: toArray(reactivationByDay, 'day'),
        bookingSlots: { created: slotsCreated, booked: slotsBooked, conversionRate: slotsCreated > 0 ? Math.round((slotsBooked / slotsCreated) * 100) : 0 },
        offers: { active: activeOffers, totalClaims },
      },
      growth: {
        totalCustomers: totalCustomersRes.count || 0,
        newCustomersTrend: toTrend(newByDate).filter((d) => d.date >= d30Date),
        referrals: {
          total: referrals.length,
          pending: referrals.filter((r) => r.status === 'pending').length,
          completed: referrals.filter((r) => r.status === 'completed').length,
        },
        vouchersBySource: toArray(vouchersBySource),
      },
    });
  } catch (err) {
    console.error('[admin/analytics]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
