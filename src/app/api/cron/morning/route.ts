export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendTrialEndingEmail,
  sendTrialExpiredEmail,
  sendChurnSurveyReminderEmail,
  sendReactivationEmail,
  sendGuidedSignupEmail,
  sendGracePeriodSetupEmail,
  sendPaymentFailedEmail,
  sendPostSurveyFollowUpEmail,
  sendPostSurveyLastChanceEmail,
} from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { getTrialStatus } from '@/lib/utils';
import {
  verifyCronAuth,
  batchGetUserEmails,
  runStandardEmailSection,
  rateLimitDelay,
  fetchAllTracking,
  canEmail,
} from '@/lib/cron-helpers';
import { CHURN_BONUS_DAYS_BY_CONVINCE } from '@/lib/churn-survey-config';
import { recommendTierForMerchant } from '@/lib/trial-tier-reco';
import { computeActivationScore } from '@/lib/activation-score';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    trialEmails: { processed: 0, ending: 0, expired: 0, churnSurvey: 0, skipped: 0, errors: 0 },
    postSurveyEmails: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    reactivation: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    dunning: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    incompleteRelance: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    gracePeriodSetup: { processed: 0, sent: 0, skipped: 0, errors: 0 },
  };

  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];

  const cronStartTime = Date.now();
  const CRON_MAX_TIME_MS = 240 * 1000;
  function isTimedOut() { return Date.now() - cronStartTime > CRON_MAX_TIME_MS; }

  const now = new Date();

  const { data: superAdminList } = await supabase.from('super_admins').select('user_id');
  const superAdminUserIds = new Set((superAdminList || []).map((sa: { user_id: string }) => sa.user_id));

  // ==================== PREFETCH ====================
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, trial_ends_at, subscription_status, churn_survey_seen_at, created_at, updated_at, reward_description, no_contact, email_bounced_at, email_unsubscribed_at, bio, shop_address');

  const allMerchantsList = allMerchants || [];
  const allUserIds = [...new Set(allMerchantsList.map(m => m.user_id))];
  const allMerchantIds = allMerchantsList.map(m => m.id);

  const [globalEmailMap, allTracking] = await Promise.all([
    batchGetUserEmails(supabase, allUserIds),
    fetchAllTracking(supabase, allMerchantIds),
  ]);

  const globalTrackingSet = new Set(
    allTracking.map(t => `${t.merchant_id}:${t.reminder_day}`)
  );

  // ==================== 1. TRIAL EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'trialEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const trialMerchants = allMerchantsList.filter(m => m.subscription_status === 'trial' && canEmail(m));

    if (trialMerchants.length > 0) {
      for (const merchant of trialMerchants) {
        results.trialEmails.processed++;
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        const email = globalEmailMap.get(merchant.user_id);

        if (!email) continue;

        if (merchant.churn_survey_seen_at) {
          results.trialEmails.skipped++;
          continue;
        }

        try {
          if (trialStatus.isActive && trialStatus.daysRemaining === 2) {
            const trackCode = -201;
            if (globalTrackingSet.has(`${merchant.id}:${trackCode}`)) continue;
            const [recommendedTier, activation, customersRes, bookingsRes] = await Promise.all([
              recommendTierForMerchant(supabase, merchant.id),
              computeActivationScore(supabase, { id: merchant.id, bio: merchant.bio, shop_address: merchant.shop_address }),
              supabase.from('customers').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
              supabase.from('merchant_planning_slots').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id).eq('booked_online', true),
            ]);
            await sendTrialEndingEmail(
              email,
              merchant.shop_name,
              trialStatus.daysRemaining,
              (merchant.locale as EmailLocale) || 'fr',
              recommendedTier,
              {
                activationState: activation.score,
                customerCount: customersRes.count ?? 0,
                bookingCount: bookingsRes.count ?? 0,
                firstPillar: activation.firstPillar,
              },
            );
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
            results.trialEmails.ending++;
            await rateLimitDelay();
          }
          if (trialStatus.isInGracePeriod) {
            const daysExpired = Math.abs(trialStatus.daysRemaining);
            if (daysExpired === 1) {
              const trackCode = -211;
              if (globalTrackingSet.has(`${merchant.id}:${trackCode}`)) continue;
              await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion, (merchant.locale as EmailLocale) || 'fr');
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
              results.trialEmails.expired++;
              await rateLimitDelay();
            }
          }
          if (trialStatus.isFullyExpired && !merchant.churn_survey_seen_at) {
            const trackCode = -213;
            if (!globalTrackingSet.has(`${merchant.id}:${trackCode}`)) {
              await sendChurnSurveyReminderEmail(email, merchant.shop_name, (merchant.locale as EmailLocale) || 'fr');
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
              results.trialEmails.churnSurvey++;
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

  // ==================== 1b. POST-SURVEY TRIAL EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'postSurveyEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const postSurveyMerchants = allMerchantsList.filter(
      m => m.subscription_status === 'trial' && m.churn_survey_seen_at && canEmail(m)
    );

    if (postSurveyMerchants.length > 0) {
      const { data: surveyData } = await supabase
        .from('merchant_churn_surveys')
        .select('merchant_id, would_convince')
        .in('merchant_id', postSurveyMerchants.map(m => m.id));
      const surveyMap = new Map(surveyData?.map(s => [s.merchant_id, s.would_convince as string]) || []);

      for (const merchant of postSurveyMerchants) {
        results.postSurveyEmails.processed++;
        const variant = surveyMap.get(merchant.id);
        if (!variant) { results.postSurveyEmails.skipped++; continue; }

        const bonusDays = CHURN_BONUS_DAYS_BY_CONVINCE[variant as keyof typeof CHURN_BONUS_DAYS_BY_CONVINCE] || 2;
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        const email = globalEmailMap.get(merchant.user_id);
        if (!email) { results.postSurveyEmails.skipped++; continue; }

        const mLocale = (merchant.locale as EmailLocale) || 'fr';
        const midDay = Math.ceil(bonusDays / 2);

        try {
          if (trialStatus.isActive && trialStatus.daysRemaining === midDay) {
            const trackCode = -221;
            if (!globalTrackingSet.has(`${merchant.id}:${trackCode}`)) {
              const result = await sendPostSurveyFollowUpEmail(email, merchant.shop_name, variant, trialStatus.daysRemaining, mLocale);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
                results.postSurveyEmails.sent++;
                await rateLimitDelay();
              }
            }
          }

          if (trialStatus.isActive && trialStatus.daysRemaining === 1 && midDay !== 1) {
            const trackCode = -222;
            if (!globalTrackingSet.has(`${merchant.id}:${trackCode}`)) {
              const result = await sendPostSurveyFollowUpEmail(email, merchant.shop_name, variant, trialStatus.daysRemaining, mLocale);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
                results.postSurveyEmails.sent++;
                await rateLimitDelay();
              }
            }
          }

          if (trialStatus.isInGracePeriod && Math.abs(trialStatus.daysRemaining) === 1) {
            const trackCode = -223;
            if (!globalTrackingSet.has(`${merchant.id}:${trackCode}`)) {
              const result = await sendPostSurveyLastChanceEmail(email, merchant.shop_name, variant, mLocale);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
                results.postSurveyEmails.sent++;
                await rateLimitDelay();
              }
            }
          }
        } catch {
          results.postSurveyEmails.errors++;
        }
      }
    }
    sectionStatuses.push({ name: 'postSurveyEmails', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'postSurveyEmails', status: 'error', error: String(error) });
  }

  // ==================== REACTIVATION (J+7/14/30 post-cancel) ====================
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

  // ==================== DUNNING — PAYMENT FAILED ====================
  // Step 1 (Day 0) is sent by Stripe webhook. Steps 2-4 here.
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
            results.dunning.sent++;
            await rateLimitDelay();
          }
        } catch {
          results.dunning.errors++;
        }
      }
    }

    sectionStatuses.push({ name: 'dunning', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'dunning', status: 'error', error: String(error) });
  }

  // ==================== INCOMPLETE SIGNUP RELANCE (T+24h) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'incompleteRelance', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
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

    const incompleteUsers = (allAuthUsers || []).filter(u => {
      if (merchantUserIdSet.has(u.id)) return false;
      if (superAdminUserIds.has(u.id)) return false;
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

      for (const user of incompleteUsers) {
        results.incompleteRelance.processed++;
        const createdAt = new Date(user.created_at);
        const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursSince >= 23 && hoursSince <= 25 && !incompleteTrackingSet.has(`${user.id}:-150`)) {
          try {
            const result = await sendGuidedSignupEmail(user.email!);
            if (result.success) {
              await supabase.from('pending_email_tracking').insert({ merchant_id: user.id, reminder_day: -150, pending_count: 0 });
              results.incompleteRelance.sent++;
              await rateLimitDelay();
            } else {
              results.incompleteRelance.errors++;
            }
          } catch { results.incompleteRelance.errors++; }
        } else {
          results.incompleteRelance.skipped++;
        }
      }
    }
    sectionStatuses.push({ name: 'incompleteRelance', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'incompleteRelance', status: 'error', error: String(error) });
  }

  // ==================== GRACE PERIOD SETUP ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'gracePeriodSetup', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
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
    sectionStatuses.push({ name: 'gracePeriodSetup', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'gracePeriodSetup', status: 'error', error: String(error) });
  }

  // ==================== CLEANUP ====================
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabase.from('pending_email_tracking').delete().lt('sent_at', sevenDaysAgo.toISOString()).gte('reminder_day', 0);

    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    await supabase.from('pending_email_tracking').delete().lt('sent_at', eightDaysAgo.toISOString()).in('reminder_day', [-201, -203, -211, -212]);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    await supabase.from('reactivation_email_tracking').delete().lt('sent_at', sixtyDaysAgo.toISOString());

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    await supabase.from('contact_messages').delete().lt('created_at', oneYearAgo.toISOString());
  } catch (error) {
    logger.error('Morning cleanup failed', error);
  }

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
