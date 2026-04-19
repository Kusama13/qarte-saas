export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendProgramReminderEmail,
  sendSocialProofEmail,
  sendVitrineReminderEmail,
  sendPlanningReminderEmail,
  sendQRCodeEmail,
  sendFirstClientScriptEmail,
  sendActivationStalledEmail,
} from '@/lib/email';
import { computeActivationScore } from '@/lib/activation-score';
import { isPlanningHidden } from '@/lib/plan-tiers';
import { TRACKING_CODES } from '@/lib/email-tracking-codes';
import type { EmailLocale } from '@/emails/translations';
import { getTrialStatus } from '@/lib/utils';
import { sendMerchantPush } from '@/lib/merchant-push';
import {
  verifyCronAuth,
  batchGetUserEmails,
  processEmailSection,
  runStandardEmailSection,
  sendOnboardingPushes,
  fetchAllTracking,
  canEmail,
} from '@/lib/cron-helpers';
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
    programReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    activationStalled: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    socialProof: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    qrCode: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstClientScript: { processed: 0, sent: 0, skipped: 0, errors: 0 },
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
    .select('id, shop_name, shop_type, slug, user_id, locale, country, trial_ends_at, subscription_status, created_at, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode, no_contact, pwa_installed_at, bio, shop_address, planning_enabled, planning_intent, email_bounced_at, email_unsubscribed_at');

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

  const configuredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description !== null && m.reward_description !== '' &&
    ['trial', 'active'].includes(m.subscription_status) && canEmail(m)
  );
  const unconfiguredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description === null &&
    ['trial', 'active'].includes(m.subscription_status) && canEmail(m)
  );

  // ==================== PROGRAM REMINDERS (J+1) + VITRINE/PLANNING ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'programReminders', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
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

    sendOnboardingPushes(sendMerchantPush, supabase, unconfiguredMerchants, {
      notificationType: 'onboarding_config_j1',
      titleFr: 'Configure ton programme de fidélité', titleEn: 'Set up your loyalty program',
      bodyFr: 'Ça prend 2 minutes, c\'est parti !', bodyEn: 'It only takes 2 minutes to get started.',
      url: '/dashboard/setup',
    }, pushPromises);

    // Social proof J+3
    {
      const seventyThreeHoursAgoSP = new Date(now.getTime() - 73 * 60 * 60 * 1000);
      const seventyTwoHoursAgoSP = new Date(now.getTime() - 72 * 60 * 60 * 1000);

      const socialProofCandidates = allMerchantsList.filter(m =>
        m.subscription_status === 'trial' && canEmail(m) &&
        m.created_at >= seventyThreeHoursAgoSP.toISOString() &&
        m.created_at <= seventyTwoHoursAgoSP.toISOString()
      );

      if (socialProofCandidates.length > 0) {
        await runStandardEmailSection(supabase, {
          candidates: socialProofCandidates,
          trackingCode: -310,
          stats: results.socialProof,
          sendFn: (email, m) => sendSocialProofEmail(email, m.shop_name, (m.locale as EmailLocale) || 'fr'),
          emailMap: globalEmailMap,
          globalTrackingSet,
        });
      }
    }

    // Vitrine reminder J+3
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

      sendOnboardingPushes(sendMerchantPush, supabase, vitrineDay3, {
        notificationType: 'onboarding_vitrine',
        titleFr: 'Complète ta vitrine en ligne', titleEn: 'Complete your online page',
        bodyFr: 'Ajoute ta bio et ton adresse pour apparaître sur Google.', bodyEn: 'Add your bio and address to appear on Google.',
        url: '/dashboard/public-page',
      }, pushPromises);
    }

    // Planning reminder J+4
    {
      const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000);
      const ninetySevenHoursAgo = new Date(now.getTime() - 97 * 60 * 60 * 1000);

      // Skip Planning Reminder for merchants who explicitly opted out of the planning module
      // (set via "Je n'utilise pas le planning" link in onboarding checklist).
      const planningDay4 = configuredActiveMerchants.filter(m =>
        m.created_at <= ninetySixHoursAgo.toISOString() && m.created_at >= ninetySevenHoursAgo.toISOString()
        && !m.planning_enabled
        && !isPlanningHidden(m)
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

      sendOnboardingPushes(sendMerchantPush, supabase, planningDay4, {
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

  // ==================== ACTIVATION STALLED (S0 J+3, plan v2 Email 8) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'activationStalled', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const seventyThreeHoursAgo = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const TRACK_ACTIVATION_STALLED = TRACKING_CODES.ACTIVATION_STALLED;

    const stalledCandidates = configuredActiveMerchants.filter(m =>
      m.subscription_status === 'trial' &&
      m.created_at <= seventyTwoHoursAgo.toISOString() &&
      m.created_at >= seventyThreeHoursAgo.toISOString() &&
      !globalTrackingSet.has(`${m.id}:${TRACK_ACTIVATION_STALLED}`)
    );

    for (const merchant of stalledCandidates) {
      results.activationStalled.processed++;
      const email = globalEmailMap.get(merchant.user_id);
      if (!email) { results.activationStalled.skipped++; continue; }

      try {
        const activation = await computeActivationScore(supabase, {
          id: merchant.id,
          bio: merchant.bio,
          shop_address: merchant.shop_address,
        });

        // On envoie uniquement aux S0 (aucun pilier atteint après 3 jours)
        if (activation.score !== 0) {
          results.activationStalled.skipped++;
          continue;
        }

        await sendActivationStalledEmail(email, merchant.shop_name, (merchant.locale as EmailLocale) || 'fr', merchant.shop_type);
        await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: TRACK_ACTIVATION_STALLED, pending_count: 0 });
        results.activationStalled.sent++;
      } catch {
        results.activationStalled.errors++;
      }
    }
    sectionStatuses.push({ name: 'activationStalled', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'activationStalled', status: 'error', error: String(error) });
  }

  // ==================== QR CODE + FIRST CLIENT SCRIPT ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // QR code + kit promo (programme configuré, envoi unique)
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
            alreadySentSet: new Set(),
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

          sendOnboardingPushes(sendMerchantPush, supabase, qrToSend, {
            notificationType: 'onboarding_qr_ready',
            titleFr: 'Ton QR code est prêt !', titleEn: 'Your QR code is ready!',
            bodyFr: 'Télécharge-le et scanne ton premier client.', bodyEn: 'Download it and start scanning clients.',
            url: '/dashboard/qr-download',
          }, pushPromises);
        }
      }
    }

    // First client script (J+2 après QR, 0 scans)
    {
      const scriptCandidates = configuredActiveMerchants;

      if (scriptCandidates.length > 0) {
        const scriptIds = scriptCandidates.map(m => m.id);

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
            alreadySentSet: new Set(),
            stats: results.firstClientScript,
            extraSkip: (m) => !m.reward_description,
            sendFn: (email, m) => sendFirstClientScriptEmail(
              email, m.shop_name, m.shop_type || '',
              m.reward_description, m.stamps_required,
              m.loyalty_mode || undefined,
              (m.locale as EmailLocale) || 'fr'
            ),
          });

          sendOnboardingPushes(sendMerchantPush, supabase, scriptToSend, {
            notificationType: 'onboarding_no_scans',
            titleFr: 'Affiche ton QR code !', titleEn: 'Display your QR code!',
            bodyFr: 'Scanne ton premier client pour lancer ton programme.', bodyEn: 'Scan your first client to start your loyalty program.',
            url: '/dashboard/qr-download',
          }, pushPromises);
        }
      }
    }

    sectionStatuses.push({ name: 'onboardingEmails', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: String(error) });
  }

  if (pushPromises.length > 0) {
    await Promise.allSettled(pushPromises);
  }

  const elapsedMs = Date.now() - cronStartTime;
  const failedSections = sectionStatuses.filter(s => s.status === 'error');
  if (failedSections.length > 0) {
    logger.error('Email onboarding cron — sections failed', failedSections);
  }
  const hasFailures = failedSections.length > 0;
  logger.info('Email onboarding cron completed', { success: !hasFailures, elapsedMs, ...results, sectionStatuses });
  return NextResponse.json(
    { success: !hasFailures, elapsedMs, ...results, sectionStatuses },
    { status: hasFailures ? 500 : 200 }
  );
}
