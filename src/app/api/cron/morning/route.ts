export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendPendingPointsEmail,
  sendTrialEndingEmail,
  sendTrialExpiredEmail,
  sendChurnSurveyReminderEmail,
  sendProgramReminderEmail,
  sendInactiveMerchantDay7Email,
  sendInactiveMerchantDay14Email,
  sendInactiveMerchantDay30Email,
  sendQRCodeEmail,
  sendFirstScanEmail,
  sendFirstBookingEmail,
  sendFirstRewardEmail,
  sendTier2UpsellEmail,
  sendReactivationEmail,
  sendFirstClientScriptEmail,
  sendGuidedSignupEmail,
  sendGracePeriodSetupEmail,
  sendVitrineReminderEmail,
  sendPlanningReminderEmail,
  sendReferralPromoEmail,
  sendReferralReminderEmail,
  sendPaymentFailedEmail,
} from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { getTrialStatus, getTodayInParis } from '@/lib/utils';
import { sendMerchantPush } from '@/lib/merchant-push';
import {
  verifyCronAuth,
  batchGetUserEmails,
  processEmailSection,
  runStandardEmailSection,
  sendOnboardingPushes,
  rateLimitDelay,
  fetchAllTracking,
} from '@/lib/cron-helpers';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email schedule for pending reminders
const INITIAL_ALERT_DAYS = [0, 1];
const REMINDER_DAYS = [2, 3];


export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    trialEmails: { processed: 0, ending: 0, expired: 0, churnSurvey: 0, errors: 0 },
    programReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    day5Checkin: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    qrCode: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstClientScript: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstScan: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstBooking: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstReward: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    tier2Upsell: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    inactiveMerchants: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    reactivation: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    incompleteRelance: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    gracePeriodSetup: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    pendingReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
  };

  // Track section statuses for isolated error handling
  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];
  // Collect push promises to await before response (avoid orphaned work on Vercel)
  const pushPromises: Promise<boolean>[] = [];

  // Hard timeout: stop processing sections after 240s (leave 60s buffer for Vercel Pro 300s limit)
  const cronStartTime = Date.now();
  const CRON_MAX_TIME_MS = 240 * 1000;
  function isTimedOut() { return Date.now() - cronStartTime > CRON_MAX_TIME_MS; }

  // Shared state across sections
  const now = new Date();
  const merchantsSentTrialEmail = new Set<string>();

  // Load super admin user IDs once — exclude from ALL automated emails
  const { data: superAdminList } = await supabase.from('super_admins').select('user_id');
  const superAdminUserIds = new Set((superAdminList || []).map((sa: { user_id: string }) => sa.user_id));

  // ==================== PREFETCH: merchants, emails, tracking ====================
  // Single fetch for all merchants — sections filter in JS instead of separate DB queries
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, shop_type, slug, user_id, locale, country, trial_ends_at, subscription_status, churn_survey_seen_at, created_at, updated_at, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode, referral_code, no_contact, birthday_gift_enabled, birthday_gift_description, offer_active, offer_title, offer_expires_at, pwa_installed_at, bio, shop_address, planning_enabled, auto_booking_enabled, email_bounced_at, email_unsubscribed_at, billing_period_start');

  const allMerchantsList = allMerchants || [];
  const allMerchantsMap = new Map(allMerchantsList.map(m => [m.id, m]));

  // Parallel fetch: user emails + tracking records
  const allUserIds = [...new Set(allMerchantsList.map(m => m.user_id))];
  const allMerchantIds = allMerchantsList.map(m => m.id);

  const [globalEmailMap, allTracking] = await Promise.all([
    batchGetUserEmails(supabase, allUserIds),
    fetchAllTracking(supabase, allMerchantIds),
  ]);

  const globalTrackingSet = new Set(
    allTracking.map(t => `${t.merchant_id}:${t.reminder_day}`)
  );

  // Pre-computed merchant filters — reused across multiple sections
  // Filter out merchants with bounced or unsubscribed emails globally
  const canEmail = (m: { no_contact?: boolean; email_bounced_at?: string | null; email_unsubscribed_at?: string | null }) =>
    !m.no_contact && !m.email_bounced_at && !m.email_unsubscribed_at;

  const configuredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description !== null && m.reward_description !== '' &&
    ['trial', 'active'].includes(m.subscription_status) && canEmail(m)
  );
  const unconfiguredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description === null &&
    ['trial', 'active'].includes(m.subscription_status) && canEmail(m)
  );

  // ==================== 1. TRIAL EMAILS ====================
  // Idempotent — tracked via pending_email_tracking with codes -201/-203 (ending) and -211/-212 (expired)
  // (Custom: multiple tracking codes per merchant, branching logic — kept manual)
  if (isTimedOut()) { sectionStatuses.push({ name: 'trialEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const trialMerchants = allMerchantsList.filter(m => m.subscription_status === 'trial' && canEmail(m));

    if (trialMerchants.length > 0) {
      for (const merchant of trialMerchants) {
        results.trialEmails.processed++;
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        const email = globalEmailMap.get(merchant.user_id);

        if (!email) continue;

        try {
          // Single trial ending email at J-2 (avoid spam — was J-3 + J-1 before)
          if (trialStatus.isActive && trialStatus.daysRemaining === 2) {
            const trackCode = -201;
            if (globalTrackingSet.has(`${merchant.id}:${trackCode}`)) continue;
            await sendTrialEndingEmail(email, merchant.shop_name, trialStatus.daysRemaining, (merchant.locale as EmailLocale) || 'fr');
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
            results.trialEmails.ending++;
            merchantsSentTrialEmail.add(merchant.id);
            await rateLimitDelay();
          }
          // Single trial expired email at J+1 (was J+1 + J+2 before)
          if (trialStatus.isInGracePeriod) {
            const daysExpired = Math.abs(trialStatus.daysRemaining);
            if (daysExpired === 1) {
              const trackCode = -211;
              if (globalTrackingSet.has(`${merchant.id}:${trackCode}`)) continue;
              await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion, (merchant.locale as EmailLocale) || 'fr');
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
              results.trialEmails.expired++;
              merchantsSentTrialEmail.add(merchant.id);
              await rateLimitDelay();
            }
          }
          // Tracking code -213 prevents re-sends after merchant completes survey
          if (trialStatus.isFullyExpired && !merchant.churn_survey_seen_at) {
            const trackCode = -213;
            if (!globalTrackingSet.has(`${merchant.id}:${trackCode}`)) {
              await sendChurnSurveyReminderEmail(email, merchant.shop_name, (merchant.locale as EmailLocale) || 'fr');
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
              results.trialEmails.churnSurvey++;
              merchantsSentTrialEmail.add(merchant.id);
              await rateLimitDelay();
            }
          }
        } catch {
          results.trialEmails.errors++;
        }
      }
    }
    sectionStatuses.push({ name: 'trialEmails', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'trialEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 2: PROGRAM REMINDERS (J+1/J+2/J+3) ====================
  // Idempotent — tracked via pending_email_tracking with codes -301/-302/-303
  if (isTimedOut()) { sectionStatuses.push({ name: 'programReminders', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // 2a. PROGRAM REMINDER (J+1)
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const unconfiguredMerchants = unconfiguredActiveMerchants.filter(m =>
      m.created_at <= twentyFourHoursAgo.toISOString() && m.created_at >= twentyFiveHoursAgo.toISOString()
    );

    await runStandardEmailSection(supabase, {
      candidates: unconfiguredMerchants,
      trackingCode: -301,
      stats: results.programReminders,
      sendFn: (email, m) => sendProgramReminderEmail(email, m.shop_name, (m.locale as EmailLocale) || 'fr'),
      emailMap: globalEmailMap,
      globalTrackingSet,
    });

    // Push onboarding J+1 (PWA only)
    sendOnboardingPushes(sendMerchantPush, supabase,unconfiguredMerchants, {
      notificationType: 'onboarding_config_j1',
      titleFr: 'Configure ton programme de fidélité', titleEn: 'Set up your loyalty program',
      bodyFr: 'Ça prend 2 minutes, c\'est parti !', bodyEn: 'It only takes 2 minutes to get started.',
      url: '/dashboard/setup',
    }, pushPromises);

    // Program Reminder J+2 and J+3 removed — too many emails in first days
    // Kept: J+1 only + Vitrine/Planning reminders for configured merchants

    // 2d-bis. VITRINE REMINDER (J+3, programme configure, vitrine vide)
    {
      const seventyThreeHoursAgo = new Date(now.getTime() - 73 * 60 * 60 * 1000);
      const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

      const vitrineDay3 = configuredActiveMerchants.filter(m =>
        m.created_at <= seventyTwoHoursAgo.toISOString() && m.created_at >= seventyThreeHoursAgo.toISOString()
        && !m.bio && !m.shop_address
      );

      await runStandardEmailSection(supabase, {
        candidates: vitrineDay3,
        trackingCode: -304,
        stats: results.programReminders,
        sendFn: (email, m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          return sendVitrineReminderEmail(email, m.shop_name, Math.max(trialStatus.daysRemaining, 0), (m.locale as EmailLocale) || 'fr');
        },
        emailMap: globalEmailMap,
        globalTrackingSet,
      });

      sendOnboardingPushes(sendMerchantPush, supabase,vitrineDay3, {
        notificationType: 'onboarding_vitrine',
        titleFr: 'Complète ta vitrine en ligne', titleEn: 'Complete your online page',
        bodyFr: 'Ajoute ta bio et ton adresse pour apparaître sur Google.', bodyEn: 'Add your bio and address to appear on Google.',
        url: '/dashboard/public-page',
      }, pushPromises);
    }

    // 2d-ter. PLANNING REMINDER (J+4, programme configure, planning desactive)
    {
      const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000);
      const ninetySevenHoursAgo = new Date(now.getTime() - 97 * 60 * 60 * 1000);

      const planningDay4 = configuredActiveMerchants.filter(m =>
        m.created_at <= ninetySixHoursAgo.toISOString() && m.created_at >= ninetySevenHoursAgo.toISOString()
        && !m.planning_enabled
      );

      await runStandardEmailSection(supabase, {
        candidates: planningDay4,
        trackingCode: -308,
        stats: results.programReminders,
        sendFn: (email, m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          return sendPlanningReminderEmail(email, m.shop_name, Math.max(trialStatus.daysRemaining, 0), (m.locale as EmailLocale) || 'fr');
        },
        emailMap: globalEmailMap,
        globalTrackingSet,
      });

      sendOnboardingPushes(sendMerchantPush, supabase,planningDay4, {
        notificationType: 'onboarding_planning',
        titleFr: 'Reçois des réservations en ligne', titleEn: 'Start receiving online bookings',
        bodyFr: 'Active ton planning en un clic.', bodyEn: 'Enable your calendar in one click.',
        url: '/dashboard/planning',
      }, pushPromises);
    }
    sectionStatuses.push({ name: 'programReminders', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'programReminders', status: 'error', error: String(error) });
  }

  // ==================== SECTION 3: ONBOARDING EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // Day 5 Checkin removed — low value, collides with other emails

    // 2e. QR CODE + KIT PROMO EMAIL (programme configure, envoi unique)
    {
      const qrCandidates = configuredActiveMerchants;

      if (qrCandidates.length > 0) {
        const qrToSend = qrCandidates.filter(m => !globalTrackingSet.has(`${m.id}:-103`));
        results.qrCode.processed = qrCandidates.length;
        results.qrCode.skipped = qrCandidates.length - qrToSend.length;

        if (qrToSend.length > 0) {
          await processEmailSection(supabase, {
            candidates: qrToSend,
            trackingCode: -103,
            emailMap: globalEmailMap,
            alreadySentSet: new Set(), // already filtered above
            stats: results.qrCode,
            sendFn: (email, m) => sendQRCodeEmail(
              email, m.shop_name,
              m.reward_description || undefined,
              m.stamps_required, m.primary_color,
              m.logo_url || undefined,
              m.tier2_enabled, m.tier2_stamps_required, m.tier2_reward_description,
              m.loyalty_mode || undefined,
              (m.locale as EmailLocale) || 'fr'
            ),
          });

          // Push QR ready (PWA only)
          sendOnboardingPushes(sendMerchantPush, supabase,qrToSend, {
            notificationType: 'onboarding_qr_ready',
            titleFr: 'Ton QR code est prêt !', titleEn: 'Your QR code is ready!',
            bodyFr: 'Télécharge-le et scanne ton premier client.', bodyEn: 'Download it and start scanning clients.',
            url: '/dashboard/qr-download',
          }, pushPromises);
        }
      }
    }

    // 2g. FIRST CLIENT SCRIPT EMAIL (J+2 apres config, 0 scans)
    {
      const scriptCandidates = configuredActiveMerchants;

      if (scriptCandidates.length > 0) {
        const scriptIds = scriptCandidates.map(m => m.id);

        // Check who got QR code email (~2 days ago)
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const { data: qrTrackings } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, sent_at')
          .in('merchant_id', scriptIds)
          .eq('reminder_day', -103)
          .limit(5000);

        const qrSent2DaysAgo = new Set(
          (qrTrackings || [])
            .filter(t => {
              const sentAt = new Date(t.sent_at);
              return sentAt <= twoDaysAgo && sentAt >= threeDaysAgo;
            })
            .map(t => t.merchant_id)
        );

        const alreadySentScript = new Set(scriptIds.filter(id => globalTrackingSet.has(`${id}:-106`)));

        // Check who has visits (exclude them)
        const { data: scriptVisits } = await supabase
          .from('visits')
          .select('merchant_id')
          .in('merchant_id', scriptIds)
          .eq('status', 'confirmed')
          .limit(10000);
        const hasVisits = new Set((scriptVisits || []).map(v => v.merchant_id));

        const scriptToSend = scriptCandidates.filter(
          m => qrSent2DaysAgo.has(m.id) && !alreadySentScript.has(m.id) && !hasVisits.has(m.id)
        );

        results.firstClientScript.processed = scriptCandidates.length;
        results.firstClientScript.skipped = scriptCandidates.length - scriptToSend.length;

        if (scriptToSend.length > 0) {
          await processEmailSection(supabase, {
            candidates: scriptToSend,
            trackingCode: -106,
            emailMap: globalEmailMap,
            alreadySentSet: new Set(), // already filtered above
            stats: results.firstClientScript,
            extraSkip: (m) => !m.reward_description,
            sendFn: (email, m) => sendFirstClientScriptEmail(
              email, m.shop_name, m.shop_type || '',
              m.reward_description, m.stamps_required,
              m.loyalty_mode || undefined,
              (m.locale as EmailLocale) || 'fr'
            ),
          });

          // Push no scans (PWA only)
          sendOnboardingPushes(sendMerchantPush, supabase,scriptToSend, {
            notificationType: 'onboarding_no_scans',
            titleFr: 'Affiche ton QR code !', titleEn: 'Display your QR code!',
            bodyFr: 'Scanne ton premier client pour lancer ton programme.', bodyEn: 'Scan your first client to start your loyalty program.',
            url: '/dashboard/qr-download',
          }, pushPromises);
        }
      }
    }

    // Quick Check removed — 3rd "no clients" email, spam feeling
    sectionStatuses.push({ name: 'onboardingEmails', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 4: MILESTONE EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'milestoneEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // 2i. FIRST SCAN EMAIL
    // Merchants with exactly 2 confirmed visits (1st is always merchant's test, 2nd is first real client)
    const allConfiguredMerchants = configuredActiveMerchants;

    if (allConfiguredMerchants.length > 0) {
      const configuredIds = allConfiguredMerchants.map(m => m.id);

      // Get visit counts per merchant
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

      // Filter to merchants with exactly 2 visits (1st = merchant test, 2nd = first real client)
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

        // Push first scan (PWA only)
        sendOnboardingPushes(sendMerchantPush, supabase,firstScanMerchants, {
          notificationType: 'onboarding_first_scan',
          titleFr: 'Premier client fidélisé !', titleEn: 'First client scanned!',
          bodyFr: 'Ton programme de fidélité est lancé.', bodyEn: 'Your loyalty program is up and running.',
          url: '/dashboard',
        }, pushPromises);
      }

      // 2f. FIRST BOOKING EMAIL
      // Merchants with auto_booking_enabled who received exactly 1 online booking
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

          sendOnboardingPushes(sendMerchantPush, supabase, firstBookingMerchants, {
            notificationType: 'onboarding_first_booking',
            titleFr: 'Premiere reservation en ligne !', titleEn: 'First online booking!',
            bodyFr: 'Une cliente vient de reserver depuis ta page.', bodyEn: 'A client just booked from your page.',
            url: '/dashboard/planning',
          }, pushPromises);
        }
      }

      // 2g. FIRST REWARD EMAIL
      // Reuse allConfiguredMerchants (same filter)
      if (allConfiguredMerchants.length > 0) {
        const programIds = allConfiguredMerchants.map(m => m.id);
        const merchantProgramMap = new Map(allConfiguredMerchants.map(m => [m.id, m]));

        // Get loyalty cards where rewards_earned > 0 (reward unlocked)
        const { data: rewardCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id, rewards_earned')
          .in('merchant_id', programIds)
          .gt('rewards_earned', 0);

        // Find merchants that have at least 1 reward earned
        const merchantsWithRewards = new Map<string, number>();
        for (const card of rewardCards || []) {
          merchantsWithRewards.set(card.merchant_id, (merchantsWithRewards.get(card.merchant_id) || 0) + card.rewards_earned);
        }

        // Filter to merchants with total rewards_earned = 1 (first reward just happened)
        const firstRewardMerchantIds = [...merchantsWithRewards.entries()]
          .filter(([, count]) => count === 1)
          .map(([id]) => id);

        if (firstRewardMerchantIds.length > 0) {
          const alreadySentReward = new Set(firstRewardMerchantIds.filter(id => globalTrackingSet.has(`${id}:-101`)));

          // This section iterates over IDs, not merchant objects — kept manual for type safety
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

      // 2g. TIER 2 UPSELL (50+ clients, tier2 pas active)
      const tier2Candidates = configuredActiveMerchants.filter(m =>
        m.tier2_enabled === null || m.tier2_enabled === false
      );

      if (tier2Candidates.length > 0) {
        const t2Ids = tier2Candidates.map(m => m.id);

        // Count unique customers per merchant
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

        // Filter to merchants with 50+ customers
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

  // ==================== SECTION 5: WEEKLY DIGEST — DISABLED ====================
  // Desactive : risque de frustrer les merchants avec des chiffres faibles.
  // Reactiver quand le merchant a assez d'activite (ex: seuil min 5 scans/semaine).

  // ==================== SECTION 6: INACTIVE MERCHANTS ====================
  // (Custom: multiple inactive days, complex tracking with compound keys — kept manual)
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

          // Skip if merchant already received onboarding emails — avoid double email
          if (globalTrackingSet.has(`${merchant.id}:-106`) || globalTrackingSet.has(`${merchant.id}:-107`)) {
            results.inactiveMerchants.skipped++;
            continue;
          }

          // Skip InactiveMerchantDay7 if merchant is in grace period (trial just expired)
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
              result = await sendInactiveMerchantDay30Email(email, merchant.shop_name, mLocale);
            }

            if (result.success) {
              await supabase.from('pending_email_tracking').insert({
                merchant_id: merchant.id,
                reminder_day: inactiveTrackingCode,
                pending_count: 0,
              });
              results.inactiveMerchants.sent++;
              await rateLimitDelay();

              // Push inactive J+7 (PWA only)
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

  // ==================== SECTION 7: REACTIVATION ====================
  // (Custom: different tracking table, promo codes, days since cancellation — kept manual)
  if (isTimedOut()) { sectionStatuses.push({ name: 'reactivation', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const REACTIVATION_DAYS = [7, 14, 30];

    const canceledMerchants = allMerchantsList.filter(m => m.subscription_status === 'canceled' && canEmail(m));

    if (canceledMerchants.length > 0) {
      const reactivationCandidates = canceledMerchants.filter(merchant => {
        const canceledAt = new Date(merchant.updated_at);
        const daysSince = Math.floor((now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24));
        return REACTIVATION_DAYS.includes(daysSince);
      });

      results.reactivation.processed = canceledMerchants.length;
      results.reactivation.skipped = canceledMerchants.length - reactivationCandidates.length;

      if (reactivationCandidates.length > 0) {
        const { data: reactivationTrackings } = await supabase
          .from('reactivation_email_tracking')
          .select('merchant_id, day_sent')
          .in('merchant_id', reactivationCandidates.map(m => m.id))
          .limit(5000);

        const reactivationTrackingSet = new Set(
          (reactivationTrackings || []).map(t => `${t.merchant_id}:${t.day_sent}`)
        );

        const { data: reactivationCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id')
          .in('merchant_id', reactivationCandidates.map(m => m.id));

        const reactivationCountMap = new Map<string, number>();
        for (const card of reactivationCards || []) {
          reactivationCountMap.set(card.merchant_id, (reactivationCountMap.get(card.merchant_id) || 0) + 1);
        }

        for (const merchant of reactivationCandidates) {
          const canceledAt = new Date(merchant.updated_at);
          const daysSinceCancellation = Math.floor(
            (now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (reactivationTrackingSet.has(`${merchant.id}:${daysSinceCancellation}`)) {
            results.reactivation.skipped++;
            continue;
          }

          const email = globalEmailMap.get(merchant.user_id);
          if (!email) { results.reactivation.skipped++; continue; }

          const totalCustomers = reactivationCountMap.get(merchant.id) || 0;

          try {
            const result = await sendReactivationEmail(
              email, merchant.shop_name, daysSinceCancellation, totalCustomers || undefined, (merchant.locale as EmailLocale) || 'fr'
            );
            if (result.success) {
              await supabase.from('reactivation_email_tracking').insert({
                merchant_id: merchant.id,
                day_sent: daysSinceCancellation,
              });
              results.reactivation.sent++;
              await rateLimitDelay();
            } else {
              results.reactivation.errors++;
            }
          } catch {
            results.reactivation.errors++;
          }
        }
      }
    }
    sectionStatuses.push({ name: 'reactivation', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'reactivation', status: 'error', error: String(error) });
  }

  // ==================== SECTION 7b: REFERRAL PROMO (J+2 post-subscription) ====================
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

    const referralStats = { processed: 0, sent: 0, skipped: 0, errors: 0 };

    await runStandardEmailSection(supabase, {
      candidates: referralCandidates,
      trackingCode: -315,
      stats: referralStats,
      sendFn: (email, m) => sendReferralPromoEmail(email, m.shop_name, m.slug, (m.locale as EmailLocale) || 'fr'),
      emailMap: globalEmailMap,
      globalTrackingSet,
    });

    sectionStatuses.push({ name: 'referralPromo', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'referralPromo', status: 'error', error: String(error) });
  }

  // ==================== SECTION 7b2: REFERRAL REMINDERS (J+14, J+30 post-subscription, 0 referrals) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'referralReminder', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // Active merchants with billing_period_start, filter J+14 or J+30
    const activeMerchantsWithBilling = allMerchantsList.filter(m =>
      m.subscription_status === 'active' && canEmail(m) && m.billing_period_start && m.slug
    );

    if (activeMerchantsWithBilling.length > 0) {
      // Check which of these merchants have 0 referrals
      const merchantIds = activeMerchantsWithBilling.map(m => m.id);
      const { data: referralCounts } = await supabase
        .from('referrals')
        .select('merchant_id')
        .in('merchant_id', merchantIds);

      const merchantsWithReferrals = new Set((referralCounts || []).map(r => r.merchant_id));

      // Filter to merchants with 0 referrals at J+14 or J+30
      const referralReminderWindows = [
        { minDays: 13, maxDays: 15, trackingCode: -316 }, // J+14
        { minDays: 29, maxDays: 31, trackingCode: -317 }, // J+30
      ];

      const referralReminderStats = { processed: 0, sent: 0, skipped: 0, errors: 0 };

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
            stats: referralReminderStats,
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

  // ==================== SECTION 7c: DUNNING — PAYMENT FAILED SEQUENCE ====================
  // Step 1 (Day 0) is sent by Stripe webhook. Steps 2-4 are sent here based on days since updated_at.
  if (isTimedOut()) { sectionStatuses.push({ name: 'dunning', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const pastDueMerchants = allMerchantsList.filter(m => m.subscription_status === 'past_due' && canEmail(m));

    if (pastDueMerchants.length > 0) {
      const DUNNING_STEPS: Array<{ days: number; step: 2 | 3 | 4; trackingCode: number }> = [
        { days: 3, step: 2, trackingCode: -401 },
        { days: 7, step: 3, trackingCode: -402 },
        { days: 10, step: 4, trackingCode: -403 },
      ];

      for (const merchant of pastDueMerchants) {
        const updatedAt = new Date(merchant.updated_at);
        const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        const matchingStep = DUNNING_STEPS.find(s => s.days === daysSince);
        if (!matchingStep) continue;
        if (globalTrackingSet.has(`${merchant.id}:${matchingStep.trackingCode}`)) continue;

        const email = globalEmailMap.get(merchant.user_id);
        if (!email) continue;

        try {
          const mLocale = (merchant.locale as EmailLocale) || 'fr';
          const result = await sendPaymentFailedEmail(email, merchant.shop_name, mLocale, matchingStep.step);
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({
              merchant_id: merchant.id, reminder_day: matchingStep.trackingCode, pending_count: 0,
            });
            await rateLimitDelay();
          }
        } catch { /* continue */ }
      }
    }

    sectionStatuses.push({ name: 'dunning', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'dunning', status: 'error', error: String(error) });
  }

  // ==================== SECTION 8: LIFECYCLE EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'lifecycleEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // 3b. INCOMPLETE SIGNUP RELANCE (T+24h, T+72h, T+7j)
    // (Custom: operates on auth users not merchants, multiple time windows — kept manual)
    {
      let allAuthUsers: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const { data: { users: batch } } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
        allAuthUsers = allAuthUsers.concat(batch || []);
        hasMore = (batch?.length || 0) === 500;
        page++;
      }
      const merchantUserIdSet = new Set(allMerchantsList.map(m => m.user_id));
      const superAdminSet = superAdminUserIds;

      const incompleteUsers = (allAuthUsers || []).filter(u => {
        if (merchantUserIdSet.has(u.id)) return false;
        if (superAdminSet.has(u.id)) return false;
        if (!u.email) return false;
        return true;
      });

      if (incompleteUsers.length > 0) {
        const { data: existingIncompleteTracking } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, reminder_day')
          .in('merchant_id', incompleteUsers.map(u => u.id))
          .in('reminder_day', [-150]);

        const incompleteTrackingSet = new Set(
          (existingIncompleteTracking || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
        );

        // Incomplete signup: only 1 cron email at T+24h (T+1h is scheduled via Resend at signup)
        const incompleteEmailWindows: Array<{
          minHours: number; maxHours: number; trackingCode: number;
          sendFn: (email: string) => Promise<{ success: boolean }>;
        }> = [
          { minHours: 23, maxHours: 25, trackingCode: -150, sendFn: sendGuidedSignupEmail },
        ];

        for (const user of incompleteUsers) {
          results.incompleteRelance.processed++;
          const createdAt = new Date(user.created_at);
          const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          let sent = false;

          for (const window of incompleteEmailWindows) {
            if (hoursSince >= window.minHours && hoursSince <= window.maxHours && !incompleteTrackingSet.has(`${user.id}:${window.trackingCode}`)) {
              try {
                const result = await window.sendFn(user.email!);
                if (result.success) {
                  await supabase.from('pending_email_tracking').insert({ merchant_id: user.id, reminder_day: window.trackingCode, pending_count: 0 });
                  results.incompleteRelance.sent++;
                  await rateLimitDelay();
                } else { results.incompleteRelance.errors++; }
              } catch { results.incompleteRelance.errors++; }
              sent = true;
              break;
            }
          }

          if (!sent) results.incompleteRelance.skipped++;
        }
      }
    }

    // Auto-Suggest Reward removed — collides with trial emails at J+5, low value

    // 3d. GRACE PERIOD SETUP (programme non configure + grace period)
    {
      const graceCandidates = allMerchantsList.filter(m =>
        m.reward_description === null && m.subscription_status === 'trial' && canEmail(m)
      );

      await runStandardEmailSection(supabase, {
        candidates: graceCandidates,
        trackingCode: -113,
        stats: results.gracePeriodSetup,
        extraSkip: (m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          return !trialStatus.isInGracePeriod;
        },
        sendFn: (email, m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          return sendGracePeriodSetupEmail(email, m.shop_name, trialStatus.daysUntilDeletion, (m.locale as EmailLocale) || 'fr');
        },
        emailMap: globalEmailMap,
        globalTrackingSet,
      });
    }
    sectionStatuses.push({ name: 'lifecycleEmails', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'lifecycleEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 9: PENDING REMINDERS ====================
  // (Custom: visits-based, complex pending count logic — kept manual)
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

    // Clean up old tracking
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabase.from('pending_email_tracking').delete().lt('sent_at', sevenDaysAgo.toISOString()).gte('reminder_day', 0);

    // Clean up recurring email tracking (trial) older than 8 days so they can be re-sent
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    await supabase.from('pending_email_tracking').delete().lt('sent_at', eightDaysAgo.toISOString()).in('reminder_day', [-201, -203, -211, -212]);

    // Clean up old reactivation tracking (> 60 jours)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    await supabase.from('reactivation_email_tracking').delete().lt('sent_at', sixtyDaysAgo.toISOString());

    // Clean up old contact messages (> 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoISO = oneYearAgo.toISOString();
    await supabase.from('contact_messages').delete().lt('created_at', oneYearAgoISO);
    sectionStatuses.push({ name: 'pendingReminders', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'pendingReminders', status: 'error', error: String(error) });
  }

  // Sections 10-14 moved to /api/cron/morning-push and /api/cron/morning-jobs

  // Await all push promises before returning (avoid orphaned work on Vercel)
  if (pushPromises.length > 0) {
    await Promise.allSettled(pushPromises);
  }

  // ==================== RESPONSE ====================
  const elapsedMs = Date.now() - cronStartTime;
  const failedSections = sectionStatuses.filter(s => s.status === 'error');
  if (failedSections.length > 0) {
    logger.error('Morning cron — sections failed', failedSections);
  }
  const hasFailures = failedSections.length > 0;
  logger.info('Morning cron completed', { success: !hasFailures, elapsedMs, ...results, sectionStatuses });
  return NextResponse.json(
    { success: !hasFailures, elapsedMs, ...results, sectionStatuses },
    { status: hasFailures ? 500 : 200 }
  );
}
