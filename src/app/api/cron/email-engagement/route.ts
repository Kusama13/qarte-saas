export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendFirstScanEmail,
  sendFirstBookingEmail,
  sendFirstRewardEmail,
  sendTier2UpsellEmail,
  sendInactiveMerchantDay7Email,
  sendInactiveMerchantDay14Email,
  sendInactiveMerchantDay30Email,
  sendReferralPromoEmail,
  sendReferralReminderEmail,
  sendPendingPointsEmail,
} from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { getTrialStatus } from '@/lib/utils';
import { sendMerchantPush } from '@/lib/merchant-push';
import {
  verifyCronAuth,
  batchGetUserEmails,
  processEmailSection,
  runStandardEmailSection,
  rateLimitDelay,
  fetchAllTracking,
  canEmail,
} from '@/lib/cron-helpers';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INITIAL_ALERT_DAYS = [0, 1];
const REMINDER_DAYS = [2, 3];

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    firstScan: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstBooking: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstReward: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    tier2Upsell: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    inactiveMerchants: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    referralPromo: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    referralReminder: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    pendingReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
  };

  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];
  const pushPromises: Promise<boolean>[] = [];

  const cronStartTime = Date.now();
  const CRON_MAX_TIME_MS = 240 * 1000;
  function isTimedOut() { return Date.now() - cronStartTime > CRON_MAX_TIME_MS; }

  const now = new Date();

  // ==================== PREFETCH ====================
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, slug, user_id, locale, trial_ends_at, subscription_status, plan_tier, created_at, reward_description, stamps_required, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode, referral_code, no_contact, pwa_installed_at, auto_booking_enabled, email_bounced_at, email_unsubscribed_at, billing_period_start');

  const allMerchantsList = allMerchants || [];
  const allMerchantsMap = new Map(allMerchantsList.map(m => [m.id, m]));
  const allUserIds = [...new Set(allMerchantsList.map(m => m.user_id))];
  const allMerchantIds = allMerchantsList.map(m => m.id);

  const [globalEmailMap, allTracking] = await Promise.all([
    batchGetUserEmails(supabase, allUserIds),
    fetchAllTracking(supabase, allMerchantIds),
  ]);

  const globalTrackingSet = new Set(
    allTracking.map(t => `${t.merchant_id}:${t.reminder_day}`)
  );

  const configuredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description !== null && m.reward_description !== '' &&
    ['trial', 'active'].includes(m.subscription_status) && canEmail(m)
  );

  // ==================== MILESTONE EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'milestoneEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const allConfiguredMerchants = configuredActiveMerchants;

    if (allConfiguredMerchants.length > 0) {
      const configuredIds = allConfiguredMerchants.map(m => m.id);

      const { data: visitCounts } = await supabase
        .from('visits')
        .select('merchant_id')
        .in('merchant_id', configuredIds)
        .eq('status', 'confirmed')
        .limit(10000);

      const visitCountMap = new Map<string, number>();
      for (const v of visitCounts || []) {
        visitCountMap.set(v.merchant_id, (visitCountMap.get(v.merchant_id) || 0) + 1);
      }

      // First scan — exactly 2 visits (1st = merchant test, 2nd = first real client)
      const firstScanMerchants = allConfiguredMerchants.filter(m => visitCountMap.get(m.id) === 2);

      if (firstScanMerchants.length > 0) {
        await runStandardEmailSection(supabase, {
          candidates: firstScanMerchants,
          trackingCode: -100,
          stats: results.firstScan,
          sendFn: (email, m) => sendFirstScanEmail(email, m.shop_name, m.referral_code, m.slug, (m.locale as EmailLocale) || 'fr'),
          emailMap: globalEmailMap,
          globalTrackingSet,
        });

        for (const m of firstScanMerchants) {
          if (!m.pwa_installed_at) continue;
          pushPromises.push(sendMerchantPush({
            supabase, merchantId: m.id, notificationType: 'onboarding_first_scan', referenceId: m.id,
            title: m.locale === 'en' ? 'First client scanned!' : 'Premier client fidélisé !',
            body: m.locale === 'en' ? 'Your loyalty program is up and running.' : 'Ton programme de fidélité est lancé.',
            url: '/dashboard', tag: 'qarte-merchant-onboarding',
          }));
        }
      }

      // First booking — merchants with auto_booking_enabled + exactly 1 online booking
      const bookingEnabledMerchants = allConfiguredMerchants.filter(m => m.auto_booking_enabled);
      if (bookingEnabledMerchants.length > 0) {
        const bookingMerchantIds = bookingEnabledMerchants.map(m => m.id);
        const { data: bookingCounts } = await supabase
          .from('merchant_planning_slots')
          .select('merchant_id')
          .in('merchant_id', bookingMerchantIds)
          .not('client_name', 'is', null)
          .not('client_name', 'eq', '__blocked__');

        const bookingCountMap = new Map<string, number>();
        for (const b of bookingCounts || []) {
          bookingCountMap.set(b.merchant_id, (bookingCountMap.get(b.merchant_id) || 0) + 1);
        }

        const firstBookingMerchants = bookingEnabledMerchants.filter(m => bookingCountMap.get(m.id) === 1);

        if (firstBookingMerchants.length > 0) {
          await runStandardEmailSection(supabase, {
            candidates: firstBookingMerchants,
            trackingCode: -105,
            stats: results.firstBooking,
            sendFn: (email, m) => sendFirstBookingEmail(email, m.shop_name, m.slug, (m.locale as EmailLocale) || 'fr'),
            emailMap: globalEmailMap,
            globalTrackingSet,
          });

          for (const m of firstBookingMerchants) {
            if (!m.pwa_installed_at) continue;
            pushPromises.push(sendMerchantPush({
              supabase, merchantId: m.id, notificationType: 'onboarding_first_booking', referenceId: m.id,
              title: m.locale === 'en' ? 'First online booking!' : 'Premiere reservation en ligne !',
              body: m.locale === 'en' ? 'A client just booked from your page.' : 'Une cliente vient de reserver depuis ta page.',
              url: '/dashboard/planning', tag: 'qarte-merchant-onboarding',
            }));
          }
        }
      }

      // First reward — total rewards_earned = 1
      {
        const programIds = allConfiguredMerchants.map(m => m.id);
        const merchantProgramMap = new Map(allConfiguredMerchants.map(m => [m.id, m]));

        const { data: rewardCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id, rewards_earned')
          .in('merchant_id', programIds)
          .gt('rewards_earned', 0);

        const merchantsWithRewards = new Map<string, number>();
        for (const card of rewardCards || []) {
          merchantsWithRewards.set(card.merchant_id, (merchantsWithRewards.get(card.merchant_id) || 0) + card.rewards_earned);
        }

        const firstRewardMerchantIds = [...merchantsWithRewards.entries()]
          .filter(([, count]) => count === 1)
          .map(([id]) => id);

        if (firstRewardMerchantIds.length > 0) {
          const alreadySentReward = new Set(firstRewardMerchantIds.filter(id => globalTrackingSet.has(`${id}:-101`)));

          for (const merchantId of firstRewardMerchantIds) {
            results.firstReward.processed++;
            if (alreadySentReward.has(merchantId)) { results.firstReward.skipped++; continue; }

            const merchant = merchantProgramMap.get(merchantId);
            if (!merchant) { results.firstReward.skipped++; continue; }

            const email = globalEmailMap.get(merchant.user_id);
            if (!email) { results.firstReward.skipped++; continue; }

            if (!merchant.reward_description) { results.firstReward.skipped++; continue; }

            try {
              const result = await sendFirstRewardEmail(email, merchant.shop_name, merchant.reward_description, merchant.loyalty_mode === 'cagnotte', (merchant.locale as EmailLocale) || 'fr');
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchantId, reminder_day: -101, pending_count: 0,
                });
                results.firstReward.sent++;
                await rateLimitDelay();
              } else { results.firstReward.errors++; }
            } catch { results.firstReward.errors++; }
          }
        }
      }

      // Tier 2 upsell (50+ clients, tier2 inactive)
      const tier2Candidates = configuredActiveMerchants.filter(m =>
        m.tier2_enabled === null || m.tier2_enabled === false
      );

      if (tier2Candidates.length > 0) {
        const t2Ids = tier2Candidates.map(m => m.id);

        const { data: loyaltyCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id, customer_id')
          .in('merchant_id', t2Ids);

        const customerCountMap = new Map<string, number>();
        const seenCustomers = new Map<string, Set<string>>();
        for (const card of loyaltyCards || []) {
          if (!seenCustomers.has(card.merchant_id)) seenCustomers.set(card.merchant_id, new Set());
          seenCustomers.get(card.merchant_id)!.add(card.customer_id);
        }
        for (const [merchantId, customers] of seenCustomers) {
          customerCountMap.set(merchantId, customers.size);
        }

        const tier2Eligible = tier2Candidates.filter(m => (customerCountMap.get(m.id) || 0) >= 50);

        if (tier2Eligible.length > 0) {
          const alreadySentTier2 = new Set(tier2Eligible.filter(m => globalTrackingSet.has(`${m.id}:-102`)).map(m => m.id));

          await processEmailSection(supabase, {
            candidates: tier2Eligible,
            trackingCode: -102,
            emailMap: globalEmailMap,
            alreadySentSet: alreadySentTier2,
            stats: results.tier2Upsell,
            extraSkip: (m) => !m.reward_description,
            sendFn: (email, m) => {
              const totalCustomers = customerCountMap.get(m.id) || 0;
              return sendTier2UpsellEmail(email, m.shop_name, totalCustomers, m.reward_description!, (m.locale as EmailLocale) || 'fr');
            },
          });
        }
      }
    }
    sectionStatuses.push({ name: 'milestoneEmails', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'milestoneEmails', status: 'error', error: String(error) });
  }

  // ==================== INACTIVE MERCHANTS (J+7/14/30) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'inactiveMerchants', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const INACTIVE_DAYS = [7, 14, 30];

    const activeMerchants = configuredActiveMerchants;

    if (activeMerchants.length > 0) {
      const merchantIds = activeMerchants.map(m => m.id);
      const { data: allLastVisits } = await supabase
        .from('visits')
        .select('merchant_id, visited_at')
        .in('merchant_id', merchantIds)
        .eq('status', 'confirmed')
        .order('visited_at', { ascending: false })
        .limit(10000);

      const lastVisitMap = new Map<string, string>();
      for (const visit of allLastVisits || []) {
        if (!lastVisitMap.has(visit.merchant_id)) {
          lastVisitMap.set(visit.merchant_id, visit.visited_at);
        }
      }

      const candidateMerchants = activeMerchants.filter(merchant => {
        const lastVisitDate = lastVisitMap.get(merchant.id);
        const referenceDate = lastVisitDate ? new Date(lastVisitDate) : new Date(merchant.created_at);
        const daysInactive = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        return INACTIVE_DAYS.includes(daysInactive);
      });

      results.inactiveMerchants.processed = activeMerchants.length;
      results.inactiveMerchants.skipped = activeMerchants.length - candidateMerchants.length;

      if (candidateMerchants.length > 0) {
        for (const merchant of candidateMerchants) {
          const lastVisitDate = lastVisitMap.get(merchant.id);
          const referenceDate = lastVisitDate ? new Date(lastVisitDate) : new Date(merchant.created_at);
          const daysInactive = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

          const inactiveTrackingCode = daysInactive === 7 ? -110 : daysInactive === 14 ? -111 : -112;
          if (globalTrackingSet.has(`${merchant.id}:${inactiveTrackingCode}`)) {
            results.inactiveMerchants.skipped++;
            continue;
          }

          if (globalTrackingSet.has(`${merchant.id}:-106`) || globalTrackingSet.has(`${merchant.id}:-107`)) {
            results.inactiveMerchants.skipped++;
            continue;
          }

          if (daysInactive === 7) {
            const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
            if (trialStatus.isInGracePeriod) {
              results.inactiveMerchants.skipped++;
              continue;
            }
          }

          const email = globalEmailMap.get(merchant.user_id);
          if (!email) {
            results.inactiveMerchants.skipped++;
            continue;
          }

          try {
            let result;
            const mLocale = (merchant.locale as EmailLocale) || 'fr';
            if (daysInactive === 7) {
              result = await sendInactiveMerchantDay7Email(email, merchant.shop_name, mLocale);
            } else if (daysInactive === 14) {
              result = await sendInactiveMerchantDay14Email(
                email,
                merchant.shop_name,
                merchant.reward_description || undefined,
                merchant.stamps_required || undefined,
                mLocale
              );
            } else {
              result = await sendInactiveMerchantDay30Email(email, merchant.shop_name, mLocale, (merchant.plan_tier as 'fidelity' | 'all_in') || 'all_in');
            }

            if (result.success) {
              await supabase.from('pending_email_tracking').insert({
                merchant_id: merchant.id,
                reminder_day: inactiveTrackingCode,
                pending_count: 0,
              });
              results.inactiveMerchants.sent++;
              await rateLimitDelay();

              if (daysInactive === 7 && merchant.pwa_installed_at) {
                pushPromises.push(sendMerchantPush({
                  supabase, merchantId: merchant.id, notificationType: 'onboarding_inactive_j7', referenceId: merchant.id,
                  title: merchant.locale === 'en' ? 'Your clients are waiting' : 'Tes clients t\'attendent',
                  body: merchant.locale === 'en' ? 'Display your QR code to start building loyalty.' : 'Affiche ton QR code pour fidéliser tes clients.',
                  url: '/dashboard', tag: 'qarte-merchant-onboarding',
                }));
              }
            } else {
              results.inactiveMerchants.errors++;
            }
          } catch {
            results.inactiveMerchants.errors++;
          }
        }
      }
    }
    sectionStatuses.push({ name: 'inactiveMerchants', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'inactiveMerchants', status: 'error', error: String(error) });
  }

  // ==================== REFERRAL PROMO (J+2 post-subscription) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'referralPromo', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const referralCandidates = allMerchantsList.filter(m =>
      m.subscription_status === 'active' && canEmail(m) &&
      m.billing_period_start &&
      m.billing_period_start <= fortyEightHoursAgo.toISOString() &&
      m.billing_period_start >= fortyNineHoursAgo.toISOString()
    );

    await runStandardEmailSection(supabase, {
      candidates: referralCandidates,
      trackingCode: -315,
      stats: results.referralPromo,
      sendFn: (email, m) => sendReferralPromoEmail(email, m.shop_name, m.slug, (m.locale as EmailLocale) || 'fr'),
      emailMap: globalEmailMap,
      globalTrackingSet,
    });

    sectionStatuses.push({ name: 'referralPromo', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'referralPromo', status: 'error', error: String(error) });
  }

  // ==================== REFERRAL REMINDERS (J+14, J+30 post-subscription, 0 referrals) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'referralReminder', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const activeMerchantsWithBilling = allMerchantsList.filter(m =>
      m.subscription_status === 'active' && canEmail(m) && m.billing_period_start && m.slug
    );

    if (activeMerchantsWithBilling.length > 0) {
      const merchantIds = activeMerchantsWithBilling.map(m => m.id);
      const { data: referralCounts } = await supabase
        .from('referrals')
        .select('merchant_id')
        .in('merchant_id', merchantIds);

      const merchantsWithReferrals = new Set((referralCounts || []).map(r => r.merchant_id));

      const referralReminderWindows = [
        { minDays: 13, maxDays: 15, trackingCode: -316 },
        { minDays: 29, maxDays: 31, trackingCode: -317 },
        { minDays: 59, maxDays: 61, trackingCode: -318 },
      ];

      for (const window of referralReminderWindows) {
        const minDate = new Date(now.getTime() - window.maxDays * 24 * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() - window.minDays * 24 * 60 * 60 * 1000);

        const candidates = activeMerchantsWithBilling.filter(m =>
          !merchantsWithReferrals.has(m.id) &&
          m.billing_period_start! >= minDate.toISOString() &&
          m.billing_period_start! <= maxDate.toISOString()
        );

        if (candidates.length > 0) {
          await runStandardEmailSection(supabase, {
            candidates,
            trackingCode: window.trackingCode,
            stats: results.referralReminder,
            sendFn: (email, m) => sendReferralReminderEmail(email, m.shop_name, m.slug, (m.locale as EmailLocale) || 'fr'),
            emailMap: globalEmailMap,
            globalTrackingSet,
          });
        }
      }
    }

    sectionStatuses.push({ name: 'referralReminder', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'referralReminder', status: 'error', error: String(error) });
  }

  // ==================== PENDING REMINDERS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'pendingReminders', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const { data: merchantsWithPending } = await supabase
      .from('visits')
      .select('merchant_id')
      .eq('status', 'pending')
      .order('merchant_id')
      .limit(10000);

    const uniqueMerchantIds = [...new Set(merchantsWithPending?.map(v => v.merchant_id) || [])];

    if (uniqueMerchantIds.length > 0) {
      const pendingMerchantMap = new Map(
        uniqueMerchantIds
          .map(id => allMerchantsMap.get(id))
          .filter((m): m is NonNullable<typeof m> => m != null && canEmail(m))
          .map(m => [m.id, m])
      );

      const { data: allPendingVisits } = await supabase
        .from('visits')
        .select('id, merchant_id, visited_at')
        .in('merchant_id', uniqueMerchantIds)
        .eq('status', 'pending')
        .order('visited_at', { ascending: true })
        .limit(10000);

      const pendingByMerchant = new Map<string, { id: string; visited_at: string }[]>();
      for (const visit of allPendingVisits || []) {
        if (!pendingByMerchant.has(visit.merchant_id)) {
          pendingByMerchant.set(visit.merchant_id, []);
        }
        pendingByMerchant.get(visit.merchant_id)!.push(visit);
      }

      for (const merchantId of uniqueMerchantIds) {
        results.pendingReminders.processed++;

        const merchant = pendingMerchantMap.get(merchantId);
        if (!merchant) {
          results.pendingReminders.errors++;
          continue;
        }

        const email = globalEmailMap.get(merchant.user_id);
        if (!email) {
          results.pendingReminders.skipped++;
          continue;
        }

        const pendingVisits = pendingByMerchant.get(merchantId);
        if (!pendingVisits || pendingVisits.length === 0) {
          results.pendingReminders.skipped++;
          continue;
        }

        const pendingCount = pendingVisits.length;
        const oldestPendingDate = new Date(pendingVisits[0].visited_at);
        const daysSinceFirst = Math.floor((now.getTime() - oldestPendingDate.getTime()) / (1000 * 60 * 60 * 24));

        const isInitialAlert = INITIAL_ALERT_DAYS.includes(daysSinceFirst);
        const isReminder = REMINDER_DAYS.includes(daysSinceFirst);

        if (!isInitialAlert && !isReminder) {
          results.pendingReminders.skipped++;
          continue;
        }

        if (globalTrackingSet.has(`${merchantId}:${daysSinceFirst}`)) {
          results.pendingReminders.skipped++;
          continue;
        }

        try {
          const result = await sendPendingPointsEmail(email, merchant.shop_name, pendingCount, isReminder, isReminder ? daysSinceFirst : undefined, (merchant.locale as EmailLocale) || 'fr');
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({
              merchant_id: merchantId,
              reminder_day: daysSinceFirst,
              pending_count: pendingCount,
            });
            results.pendingReminders.sent++;
            await rateLimitDelay();
          } else {
            results.pendingReminders.errors++;
          }
        } catch {
          results.pendingReminders.errors++;
        }
      }
    }

    sectionStatuses.push({ name: 'pendingReminders', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'pendingReminders', status: 'error', error: String(error) });
  }

  if (pushPromises.length > 0) {
    await Promise.allSettled(pushPromises);
  }

  const elapsedMs = Date.now() - cronStartTime;
  const failedSections = sectionStatuses.filter(s => s.status === 'error');
  if (failedSections.length > 0) {
    logger.error('Email engagement cron — sections failed', failedSections);
  }
  const hasFailures = failedSections.length > 0;
  logger.info('Email engagement cron completed', { success: !hasFailures, elapsedMs, ...results, sectionStatuses });
  return NextResponse.json(
    { success: !hasFailures, elapsedMs, ...results, sectionStatuses },
    { status: hasFailures ? 500 : 200 }
  );
}
