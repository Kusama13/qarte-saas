import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import {
  sendPendingPointsEmail,
  sendTrialEndingEmail,
  sendTrialExpiredEmail,
  sendProgramReminderEmail,
  sendProgramReminderDay2Email,
  sendProgramReminderDay3Email,
  sendInactiveMerchantDay7Email,
  sendInactiveMerchantDay14Email,
  sendInactiveMerchantDay30Email,
  sendDay5CheckinEmail,
  sendQRCodeEmail,
  sendFirstScanEmail,
  sendFirstRewardEmail,
  sendTier2UpsellEmail,
  sendReactivationEmail,
  sendFirstClientScriptEmail,
  sendQuickCheckEmail,
  sendChallengeCompletedEmail,
  sendGuidedSignupEmail,
  sendSetupForYouEmail,
  sendLastChanceSignupEmail,
  sendAutoSuggestRewardEmail,
  sendGracePeriodSetupEmail,
} from '@/lib/email';
import { getTrialStatus, getTodayInParis } from '@/lib/utils';
import { sendAutomationPush, getUpcomingEvent } from '@/lib/push-automation';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);
}

// Email schedule for pending reminders
const INITIAL_ALERT_DAYS = [0, 1];
const REMINDER_DAYS = [2, 3];

// Helper: process items sequentially with 600ms pause between each (Resend rate limit: 2 req/s)
async function batchProcess<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i++) {
    await fn(items[i]);
    // Resend rate limit: 2 req/s — pause après chaque envoi
    await new Promise(resolve => setTimeout(resolve, 600));
  }
}

// Helper: batch fetch user emails by user_id (Supabase auth, pas Resend — pas de rate limit strict)
async function batchGetUserEmails(userIds: string[]): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (userId) => {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (email) emailMap.set(userId, email);
    }));
  }
  return emailMap;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    trialEmails: { processed: 0, ending: 0, expired: 0, errors: 0 },
    programReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    programRemindersDay2: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    programRemindersDay3: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    day5Checkin: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    qrCode: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstClientScript: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    quickCheck: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstScan: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    firstReward: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    tier2Upsell: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    inactiveMerchants: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    challengeCompleted: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    reactivation: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    incompleteRelance: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    autoSuggestReward: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    gracePeriodSetup: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    pendingReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    scheduledPush: { processed: 0, sent: 0, errors: 0 },
    birthdayVouchers: { processed: 0, created: 0, skipped: 0, errors: 0 },
    pushAutomations: {
      inactive: { sent: 0, skipped: 0, errors: 0 },
      reward: { sent: 0, skipped: 0, errors: 0 },
      events: { sent: 0, skipped: 0, errors: 0 },
    },
  };

  // Track section statuses for isolated error handling (C6 fix)
  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];

  // Shared state across sections
  const now = new Date();
  const merchantsSentTrialEmail = new Set<string>();

  // ==================== 1. TRIAL EMAILS ====================
  // C7: Idempotent — tracked via pending_email_tracking with codes -201/-203 (ending) and -211/-212 (expired)
  try {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trial')
      .neq('no_contact', true);

    if (merchants && merchants.length > 0) {
      // Batch fetch all user emails upfront
      const userIds = [...new Set(merchants.map(m => m.user_id))];
      const emailMap = await batchGetUserEmails(userIds);

      // C7: Batch fetch existing trial email tracking
      const { data: existingTrialTracking } = await supabase
        .from('pending_email_tracking')
        .select('merchant_id, reminder_day')
        .in('merchant_id', merchants.map(m => m.id))
        .in('reminder_day', [-201, -203, -211, -212]);
      const trialTrackingSet = new Set(
        (existingTrialTracking || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
      );

      await batchProcess(merchants, async (merchant) => {
        results.trialEmails.processed++;
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        const email = emailMap.get(merchant.user_id);

        if (!email) return;

        try {
          if (trialStatus.isActive && (trialStatus.daysRemaining === 3 || trialStatus.daysRemaining === 1)) {
            const trackCode = trialStatus.daysRemaining === 3 ? -203 : -201;
            if (trialTrackingSet.has(`${merchant.id}:${trackCode}`)) return;
            await sendTrialEndingEmail(email, merchant.shop_name, trialStatus.daysRemaining);
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
            results.trialEmails.ending++;
            merchantsSentTrialEmail.add(merchant.id);
          }
          if (trialStatus.isInGracePeriod) {
            const daysExpired = Math.abs(trialStatus.daysRemaining);
            if (daysExpired === 1 || daysExpired === 2) {
              const trackCode = daysExpired === 1 ? -211 : -212;
              if (trialTrackingSet.has(`${merchant.id}:${trackCode}`)) return;
              const promoCode = daysExpired === 1 ? 'QARTE50' : undefined;
              await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion, promoCode);
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
              results.trialEmails.expired++;
              merchantsSentTrialEmail.add(merchant.id);
            }
          }
        } catch {
          results.trialEmails.errors++;
        }
      });
    }
  } catch (error) {
    sectionStatuses.push({ name: 'trialEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 2: PROGRAM REMINDERS (J+1/J+2/J+3) ====================
  // C7: Idempotent — tracked via pending_email_tracking with codes -301/-302/-303
  try {
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: unconfiguredMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id')
      .is('reward_description', null)
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', twentyFourHoursAgo.toISOString())
      .gte('created_at', twentyFiveHoursAgo.toISOString())
      .neq('no_contact', true);

    if (unconfiguredMerchants && unconfiguredMerchants.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(unconfiguredMerchants.map(m => m.user_id))]);
      const { data: existingJ1 } = await supabase.from('pending_email_tracking').select('merchant_id').in('merchant_id', unconfiguredMerchants.map(m => m.id)).eq('reminder_day', -301);
      const alreadySentJ1 = new Set((existingJ1 || []).map(t => t.merchant_id));

      await batchProcess(unconfiguredMerchants, async (merchant) => {
        results.programReminders.processed++;
        if (alreadySentJ1.has(merchant.id)) { results.programReminders.skipped++; return; }
        const email = emailMap.get(merchant.user_id);
        if (!email) { results.programReminders.skipped++; return; }

        try {
          const result = await sendProgramReminderEmail(email, merchant.shop_name);
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: -301, pending_count: 0 });
            results.programReminders.sent++;
          } else { results.programReminders.errors++; }
        } catch { results.programReminders.errors++; }
      });
    }

    // ==================== 2b. PROGRAM REMINDER (J+2) ====================
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: unconfiguredDay2 } = await supabase
      .from('merchants')
      .select('id, shop_name, shop_type, user_id')
      .is('reward_description', null)
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', fortyEightHoursAgo.toISOString())
      .gte('created_at', fortyNineHoursAgo.toISOString())
      .neq('no_contact', true);

    if (unconfiguredDay2 && unconfiguredDay2.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(unconfiguredDay2.map(m => m.user_id))]);
      const { data: existingJ2 } = await supabase.from('pending_email_tracking').select('merchant_id').in('merchant_id', unconfiguredDay2.map(m => m.id)).eq('reminder_day', -302);
      const alreadySentJ2 = new Set((existingJ2 || []).map(t => t.merchant_id));

      await batchProcess(unconfiguredDay2, async (merchant) => {
        results.programRemindersDay2.processed++;
        if (alreadySentJ2.has(merchant.id)) { results.programRemindersDay2.skipped++; return; }
        const email = emailMap.get(merchant.user_id);
        if (!email) { results.programRemindersDay2.skipped++; return; }

        try {
          const result = await sendProgramReminderDay2Email(email, merchant.shop_name, merchant.shop_type || '');
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: -302, pending_count: 0 });
            results.programRemindersDay2.sent++;
          } else { results.programRemindersDay2.errors++; }
        } catch { results.programRemindersDay2.errors++; }
      });
    }

    // ==================== 2c. PROGRAM REMINDER (J+3) ====================
    const seventyThreeHoursAgo = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const { data: unconfiguredDay3 } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, trial_ends_at, subscription_status')
      .is('reward_description', null)
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', seventyTwoHoursAgo.toISOString())
      .gte('created_at', seventyThreeHoursAgo.toISOString())
      .neq('no_contact', true);

    if (unconfiguredDay3 && unconfiguredDay3.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(unconfiguredDay3.map(m => m.user_id))]);
      const { data: existingJ3 } = await supabase.from('pending_email_tracking').select('merchant_id').in('merchant_id', unconfiguredDay3.map(m => m.id)).eq('reminder_day', -303);
      const alreadySentJ3 = new Set((existingJ3 || []).map(t => t.merchant_id));

      await batchProcess(unconfiguredDay3, async (merchant) => {
        results.programRemindersDay3.processed++;

        if (merchantsSentTrialEmail.has(merchant.id) || alreadySentJ3.has(merchant.id)) {
          results.programRemindersDay3.skipped++;
          return;
        }

        const email = emailMap.get(merchant.user_id);
        if (!email) { results.programRemindersDay3.skipped++; return; }

        try {
          const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
          const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
          const result = await sendProgramReminderDay3Email(email, merchant.shop_name, daysRemaining);
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: -303, pending_count: 0 });
            results.programRemindersDay3.sent++;
          } else { results.programRemindersDay3.errors++; }
        } catch { results.programRemindersDay3.errors++; }
      });
    }
  } catch (error) {
    sectionStatuses.push({ name: 'programReminders', status: 'error', error: String(error) });
  }

  // ==================== SECTION 3: ONBOARDING EMAILS ====================
  try {
    // ==================== 2d. DAY 5 CHECKIN (programme configuré, J+5) ====================
    // C7: Idempotent — tracked via pending_email_tracking with code -305
    const oneTwentyOneHoursAgo = new Date(now.getTime() - 121 * 60 * 60 * 1000);
    const oneTwentyHoursAgo = new Date(now.getTime() - 120 * 60 * 60 * 1000);

    const { data: day5Merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', oneTwentyHoursAgo.toISOString())
      .gte('created_at', oneTwentyOneHoursAgo.toISOString())
      .neq('no_contact', true);

    if (day5Merchants && day5Merchants.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(day5Merchants.map(m => m.user_id))]);

      // C7: Check tracking
      const { data: existingDay5 } = await supabase.from('pending_email_tracking').select('merchant_id').in('merchant_id', day5Merchants.map(m => m.id)).eq('reminder_day', -305);
      const alreadySentDay5 = new Set((existingDay5 || []).map(t => t.merchant_id));

      // Get scan counts for these merchants
      const day5Ids = day5Merchants.map(m => m.id);
      const { data: day5Visits } = await supabase
        .from('visits')
        .select('merchant_id')
        .in('merchant_id', day5Ids)
        .eq('status', 'confirmed');

      const scanCountMap = new Map<string, number>();
      for (const v of day5Visits || []) {
        scanCountMap.set(v.merchant_id, (scanCountMap.get(v.merchant_id) || 0) + 1);
      }

      await batchProcess(day5Merchants, async (merchant) => {
        results.day5Checkin.processed++;
        if (alreadySentDay5.has(merchant.id)) { results.day5Checkin.skipped++; return; }
        const email = emailMap.get(merchant.user_id);
        if (!email) { results.day5Checkin.skipped++; return; }

        try {
          const totalScans = scanCountMap.get(merchant.id) || 0;
          if (totalScans === 0) { results.day5Checkin.skipped++; return; }
          const result = await sendDay5CheckinEmail(email, merchant.shop_name, totalScans);
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: -305, pending_count: 0 });
            results.day5Checkin.sent++;
          }
          else { results.day5Checkin.errors++; }
        } catch { results.day5Checkin.errors++; }
      });
    }

    // ==================== 2e. QR CODE + KIT PROMO EMAIL (programme configuré, envoi unique) ====================
    {
      const { data: qrCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .neq('no_contact', true);

      if (qrCandidates && qrCandidates.length > 0) {
        // Check tracking to avoid sending twice
        const { data: existingQr } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id')
          .in('merchant_id', qrCandidates.map(m => m.id))
          .eq('reminder_day', -103);

        const alreadySentQr = new Set((existingQr || []).map(t => t.merchant_id));
        const qrToSend = qrCandidates.filter(m => !alreadySentQr.has(m.id));
        results.qrCode.processed = qrCandidates.length;
        results.qrCode.skipped = qrCandidates.length - qrToSend.length;

        if (qrToSend.length > 0) {
          const qrEmailMap = await batchGetUserEmails([...new Set(qrToSend.map(m => m.user_id))]);

          await batchProcess(qrToSend, async (merchant) => {
            const email = qrEmailMap.get(merchant.user_id);
            if (!email) { results.qrCode.skipped++; return; }

            try {
              const result = await sendQRCodeEmail(
                email, merchant.shop_name,
                merchant.reward_description || undefined,
                merchant.stamps_required, merchant.primary_color,
                merchant.logo_url || undefined,
                merchant.tier2_enabled, merchant.tier2_stamps_required, merchant.tier2_reward_description
              );
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchant.id, reminder_day: -103, pending_count: 0,
                });
                results.qrCode.sent++;
              } else { results.qrCode.errors++; }
            } catch { results.qrCode.errors++; }
          });
        }
      }
    }

    // ==================== 2f. CHALLENGE COMPLETED (5 unique clients in 3 days) ====================
    {
      // Find trial merchants created within last 10 days (generous window to catch late completions)
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const { data: challengeCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, created_at')
        .eq('subscription_status', 'trial')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .gte('created_at', tenDaysAgo.toISOString())
        .neq('no_contact', true);

      if (challengeCandidates && challengeCandidates.length > 0) {
        const challengeIds = challengeCandidates.map(m => m.id);

        // Check who already received the challenge email
        const { data: existingChallenge } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id')
          .in('merchant_id', challengeIds)
          .eq('reminder_day', -104);
        const alreadySentChallenge = new Set((existingChallenge || []).map(t => t.merchant_id));

        // Get unique customers per merchant — count customers created within 3 days of merchant creation
        const { data: challengeCustomers } = await supabase
          .from('customers')
          .select('id, merchant_id, created_at')
          .in('merchant_id', challengeIds);

        // Count unique customers created within 3 days of merchant creation
        const merchantCreatedMap = new Map(challengeCandidates.map(m => [m.id, new Date(m.created_at)]));
        const customerCountMap = new Map<string, number>();
        for (const customer of challengeCustomers || []) {
          const merchantCreated = merchantCreatedMap.get(customer.merchant_id);
          if (!merchantCreated) continue;
          const threeDaysAfter = new Date(merchantCreated.getTime() + 3 * 24 * 60 * 60 * 1000);
          if (new Date(customer.created_at) <= threeDaysAfter) {
            customerCountMap.set(customer.merchant_id, (customerCountMap.get(customer.merchant_id) || 0) + 1);
          }
        }

        // Filter to merchants with >= 5 unique clients and not already sent
        const challengeToSend = challengeCandidates.filter(
          m => !alreadySentChallenge.has(m.id) && (customerCountMap.get(m.id) || 0) >= 5
        );

        results.challengeCompleted.processed = challengeCandidates.length;
        results.challengeCompleted.skipped = challengeCandidates.length - challengeToSend.length;

        if (challengeToSend.length > 0) {
          const challengeEmailMap = await batchGetUserEmails([...new Set(challengeToSend.map(m => m.user_id))]);

          await batchProcess(challengeToSend, async (merchant) => {
            const email = challengeEmailMap.get(merchant.user_id);
            if (!email) { results.challengeCompleted.skipped++; return; }

            try {
              const result = await sendChallengeCompletedEmail(email, merchant.shop_name, 'QARTE50');
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchant.id, reminder_day: -104, pending_count: 0,
                });
                results.challengeCompleted.sent++;
              } else { results.challengeCompleted.errors++; }
            } catch { results.challengeCompleted.errors++; }
          });
        }
      }
    }

    // ==================== 2g. FIRST CLIENT SCRIPT EMAIL (J+2 après config, 0 scans) ====================
    {
      // Find merchants who got QR code email exactly 2 days ago
      const { data: scriptCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, shop_type, reward_description, stamps_required, trial_ends_at, subscription_status')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .neq('no_contact', true);

      if (scriptCandidates && scriptCandidates.length > 0) {
        const scriptIds = scriptCandidates.map(m => m.id);

        // Check who got QR code email (~2 days ago)
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const { data: qrTrackings } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, sent_at')
          .in('merchant_id', scriptIds)
          .eq('reminder_day', -103);

        const qrSent2DaysAgo = new Set(
          (qrTrackings || [])
            .filter(t => {
              const sentAt = new Date(t.sent_at);
              return sentAt <= twoDaysAgo && sentAt >= threeDaysAgo;
            })
            .map(t => t.merchant_id)
        );

        // Check who already got this email
        const { data: existingScript } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id')
          .in('merchant_id', scriptIds)
          .eq('reminder_day', -106);
        const alreadySentScript = new Set((existingScript || []).map(t => t.merchant_id));

        // Check who has visits (exclude them)
        const { data: scriptVisits } = await supabase
          .from('visits')
          .select('merchant_id')
          .in('merchant_id', scriptIds)
          .eq('status', 'confirmed');
        const hasVisits = new Set((scriptVisits || []).map(v => v.merchant_id));

        const scriptToSend = scriptCandidates.filter(
          m => qrSent2DaysAgo.has(m.id) && !alreadySentScript.has(m.id) && !hasVisits.has(m.id)
        );

        results.firstClientScript.processed = scriptCandidates.length;
        results.firstClientScript.skipped = scriptCandidates.length - scriptToSend.length;

        if (scriptToSend.length > 0) {
          const scriptEmailMap = await batchGetUserEmails([...new Set(scriptToSend.map(m => m.user_id))]);

          await batchProcess(scriptToSend, async (merchant) => {
            const email = scriptEmailMap.get(merchant.user_id);
            if (!email) { results.firstClientScript.skipped++; return; }

            if (!merchant.reward_description) { results.firstClientScript.skipped++; return; }

            try {
              const result = await sendFirstClientScriptEmail(
                email, merchant.shop_name, merchant.shop_type || '',
                merchant.reward_description, merchant.stamps_required
              );
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchant.id, reminder_day: -106, pending_count: 0,
                });
                results.firstClientScript.sent++;
              } else { results.firstClientScript.errors++; }
            } catch { results.firstClientScript.errors++; }
          });
        }
      }
    }

    // ==================== 2h. QUICK CHECK EMAIL (J+4 après config, 0 scans) ====================
    {
      const { data: qcCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, trial_ends_at, subscription_status')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .neq('no_contact', true);

      if (qcCandidates && qcCandidates.length > 0) {
        const qcIds = qcCandidates.map(m => m.id);

        // Check who got QR code email ~4 days ago
        const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const { data: qrTrackings4 } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, sent_at')
          .in('merchant_id', qcIds)
          .eq('reminder_day', -103);

        const qrSent4DaysAgo = new Set(
          (qrTrackings4 || [])
            .filter(t => {
              const sentAt = new Date(t.sent_at);
              return sentAt <= fourDaysAgo && sentAt >= fiveDaysAgo;
            })
            .map(t => t.merchant_id)
        );

        // Check who already got this email
        const { data: existingQc } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id')
          .in('merchant_id', qcIds)
          .eq('reminder_day', -107);
        const alreadySentQc = new Set((existingQc || []).map(t => t.merchant_id));

        // Check who has visits
        const { data: qcVisits } = await supabase
          .from('visits')
          .select('merchant_id')
          .in('merchant_id', qcIds)
          .eq('status', 'confirmed');
        const qcHasVisits = new Set((qcVisits || []).map(v => v.merchant_id));

        const qcToSend = qcCandidates.filter(
          m => qrSent4DaysAgo.has(m.id) && !alreadySentQc.has(m.id) && !qcHasVisits.has(m.id)
        );

        results.quickCheck.processed = qcCandidates.length;
        results.quickCheck.skipped = qcCandidates.length - qcToSend.length;

        if (qcToSend.length > 0) {
          const qcEmailMap = await batchGetUserEmails([...new Set(qcToSend.map(m => m.user_id))]);

          await batchProcess(qcToSend, async (merchant) => {
            const email = qcEmailMap.get(merchant.user_id);
            if (!email) { results.quickCheck.skipped++; return; }

            try {
              const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
              const daysRemaining = Math.max(trialStatus.daysRemaining, 1);
              const result = await sendQuickCheckEmail(email, merchant.shop_name, daysRemaining);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchant.id, reminder_day: -107, pending_count: 0,
                });
                results.quickCheck.sent++;
              } else { results.quickCheck.errors++; }
            } catch { results.quickCheck.errors++; }
          });
        }
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 4: MILESTONE EMAILS ====================
  try {
    // ==================== 2i. FIRST SCAN EMAIL ====================
    // Merchants with exactly 2 confirmed visits (1st is always merchant's test, 2nd is first real client)
    const { data: allConfiguredMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, referral_code')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active'])
      .neq('no_contact', true);

    if (allConfiguredMerchants && allConfiguredMerchants.length > 0) {
      const configuredIds = allConfiguredMerchants.map(m => m.id);

      // Get visit counts per merchant
      const { data: visitCounts } = await supabase
        .from('visits')
        .select('merchant_id')
        .in('merchant_id', configuredIds)
        .eq('status', 'confirmed');

      const visitCountMap = new Map<string, number>();
      for (const v of visitCounts || []) {
        visitCountMap.set(v.merchant_id, (visitCountMap.get(v.merchant_id) || 0) + 1);
      }

      // Filter to merchants with exactly 2 visits (1st = merchant test, 2nd = first real client)
      const firstScanMerchants = allConfiguredMerchants.filter(m => visitCountMap.get(m.id) === 2);

      if (firstScanMerchants.length > 0) {
        // Check tracking to avoid sending twice
        const { data: existingFirstScan } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id')
          .in('merchant_id', firstScanMerchants.map(m => m.id))
          .eq('reminder_day', -100);

        const alreadySent = new Set((existingFirstScan || []).map(t => t.merchant_id));

        const emailMap = await batchGetUserEmails([...new Set(firstScanMerchants.map(m => m.user_id))]);

        await batchProcess(firstScanMerchants, async (merchant) => {
          results.firstScan.processed++;
          if (alreadySent.has(merchant.id)) { results.firstScan.skipped++; return; }

          const email = emailMap.get(merchant.user_id);
          if (!email) { results.firstScan.skipped++; return; }

          try {
            const result = await sendFirstScanEmail(email, merchant.shop_name, merchant.referral_code);
            if (result.success) {
              await supabase.from('pending_email_tracking').insert({
                merchant_id: merchant.id, reminder_day: -100, pending_count: 0,
              });
              results.firstScan.sent++;
            } else { results.firstScan.errors++; }
          } catch { results.firstScan.errors++; }
        });
      }

      // ==================== 2f. FIRST REWARD EMAIL ====================
      // Check for merchants where a customer has reached stamps_required
      const { data: merchantsWithProgram } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, reward_description, stamps_required')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .neq('no_contact', true);

      if (merchantsWithProgram && merchantsWithProgram.length > 0) {
        const programIds = merchantsWithProgram.map(m => m.id);
        const merchantProgramMap = new Map(merchantsWithProgram.map(m => [m.id, m]));

        // Get loyalty cards where current_stamps >= stamps_required (reward unlocked)
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
          // Check tracking
          const { data: existingFirstReward } = await supabase
            .from('pending_email_tracking')
            .select('merchant_id')
            .in('merchant_id', firstRewardMerchantIds)
            .eq('reminder_day', -101);

          const alreadySentReward = new Set((existingFirstReward || []).map(t => t.merchant_id));

          const rewardEmailMap = await batchGetUserEmails(
            [...new Set(firstRewardMerchantIds
              .filter(id => !alreadySentReward.has(id))
              .map(id => merchantProgramMap.get(id)?.user_id)
              .filter(Boolean) as string[])]
          );

          await batchProcess(firstRewardMerchantIds, async (merchantId) => {
            results.firstReward.processed++;
            if (alreadySentReward.has(merchantId)) { results.firstReward.skipped++; return; }

            const merchant = merchantProgramMap.get(merchantId);
            if (!merchant) { results.firstReward.skipped++; return; }

            const email = rewardEmailMap.get(merchant.user_id);
            if (!email) { results.firstReward.skipped++; return; }

            if (!merchant.reward_description) { results.firstReward.skipped++; return; }

            try {
              const result = await sendFirstRewardEmail(email, merchant.shop_name, merchant.reward_description);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchantId, reminder_day: -101, pending_count: 0,
                });
                results.firstReward.sent++;
              } else { results.firstReward.errors++; }
            } catch { results.firstReward.errors++; }
          });
        }
      }

      // ==================== 2g. TIER 2 UPSELL (50+ clients, tier2 pas activé) ====================
      const { data: tier2Candidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, reward_description, tier2_enabled')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .or('tier2_enabled.is.null,tier2_enabled.eq.false')
        .neq('no_contact', true);

      if (tier2Candidates && tier2Candidates.length > 0) {
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
          // Check tracking
          const { data: existingTier2 } = await supabase
            .from('pending_email_tracking')
            .select('merchant_id')
            .in('merchant_id', tier2Eligible.map(m => m.id))
            .eq('reminder_day', -102);

          const alreadySentTier2 = new Set((existingTier2 || []).map(t => t.merchant_id));
          const t2EmailMap = await batchGetUserEmails([...new Set(tier2Eligible.map(m => m.user_id))]);

          await batchProcess(tier2Eligible, async (merchant) => {
            results.tier2Upsell.processed++;
            if (alreadySentTier2.has(merchant.id)) { results.tier2Upsell.skipped++; return; }

            const email = t2EmailMap.get(merchant.user_id);
            if (!email) { results.tier2Upsell.skipped++; return; }

            try {
              const totalCustomers = customerCountMap.get(merchant.id) || 0;
              if (!merchant.reward_description) { results.tier2Upsell.skipped++; return; }
              const result = await sendTier2UpsellEmail(email, merchant.shop_name, totalCustomers, merchant.reward_description);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({
                  merchant_id: merchant.id, reminder_day: -102, pending_count: 0,
                });
                results.tier2Upsell.sent++;
              } else { results.tier2Upsell.errors++; }
            } catch { results.tier2Upsell.errors++; }
          });
        }
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'milestoneEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 5: WEEKLY DIGEST — DISABLED ====================
  // Désactivé : risque de frustrer les merchants avec des chiffres faibles.
  // Réactiver quand le merchant a assez d'activité (ex: seuil min 5 scans/semaine).

  // ==================== SECTION 6: INACTIVE MERCHANTS ====================
  try {
    const INACTIVE_DAYS = [7, 14, 30];

    const { data: activeMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, reward_description, stamps_required, created_at, trial_ends_at, subscription_status')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active'])
      .neq('no_contact', true);

    if (activeMerchants && activeMerchants.length > 0) {
      // Batch fetch last visits for ALL active merchants in one query (instead of N queries)
      const merchantIds = activeMerchants.map(m => m.id);
      const { data: allLastVisits } = await supabase
        .from('visits')
        .select('merchant_id, visited_at')
        .in('merchant_id', merchantIds)
        .eq('status', 'confirmed')
        .order('visited_at', { ascending: false });

      // Build map: merchant_id -> last visit date
      const lastVisitMap = new Map<string, string>();
      for (const visit of allLastVisits || []) {
        if (!lastVisitMap.has(visit.merchant_id)) {
          lastVisitMap.set(visit.merchant_id, visit.visited_at);
        }
      }

      // Filter to only merchants that match INACTIVE_DAYS
      const candidateMerchants = activeMerchants.filter(merchant => {
        const lastVisitDate = lastVisitMap.get(merchant.id);
        const referenceDate = lastVisitDate ? new Date(lastVisitDate) : new Date(merchant.created_at);
        const daysInactive = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        return INACTIVE_DAYS.includes(daysInactive);
      });

      results.inactiveMerchants.processed = activeMerchants.length;
      results.inactiveMerchants.skipped = activeMerchants.length - candidateMerchants.length;

      if (candidateMerchants.length > 0) {
        // Batch check existing tracking for candidates
        const { data: existingTrackings } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, reminder_day')
          .in('merchant_id', candidateMerchants.map(m => m.id))
          .lt('reminder_day', 0);

        const trackingSet = new Set(
          (existingTrackings || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
        );

        // Batch fetch emails
        const emailMap = await batchGetUserEmails([...new Set(candidateMerchants.map(m => m.user_id))]);

        await batchProcess(candidateMerchants, async (merchant) => {
          const lastVisitDate = lastVisitMap.get(merchant.id);
          const referenceDate = lastVisitDate ? new Date(lastVisitDate) : new Date(merchant.created_at);
          const daysInactive = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

          if (trackingSet.has(`${merchant.id}:${-daysInactive}`)) {
            results.inactiveMerchants.skipped++;
            return;
          }

          // Skip if merchant already received onboarding emails — avoid double email
          if (trackingSet.has(`${merchant.id}:-106`) || trackingSet.has(`${merchant.id}:-107`)) {
            results.inactiveMerchants.skipped++;
            return;
          }

          // Skip InactiveMerchantDay7 if merchant is in grace period (trial just expired)
          if (daysInactive === 7) {
            const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
            if (trialStatus.isInGracePeriod) {
              results.inactiveMerchants.skipped++;
              return;
            }
          }

          const email = emailMap.get(merchant.user_id);
          if (!email) {
            results.inactiveMerchants.skipped++;
            return;
          }

          try {
            let result;
            if (daysInactive === 7) {
              result = await sendInactiveMerchantDay7Email(email, merchant.shop_name);
            } else if (daysInactive === 14) {
              result = await sendInactiveMerchantDay14Email(
                email,
                merchant.shop_name,
                merchant.reward_description || undefined,
                merchant.stamps_required || undefined
              );
            } else {
              result = await sendInactiveMerchantDay30Email(email, merchant.shop_name);
            }

            if (result.success) {
              await supabase.from('pending_email_tracking').insert({
                merchant_id: merchant.id,
                reminder_day: -daysInactive,
                pending_count: 0,
              });
              results.inactiveMerchants.sent++;
            } else {
              results.inactiveMerchants.errors++;
            }
          } catch {
            results.inactiveMerchants.errors++;
          }
        });
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'inactiveMerchants', status: 'error', error: String(error) });
  }

  // ==================== SECTION 7: REACTIVATION ====================
  try {
    const REACTIVATION_DAYS = [7, 14, 30];

    const { data: canceledMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, updated_at')
      .eq('subscription_status', 'canceled')
      .neq('no_contact', true);

    if (canceledMerchants && canceledMerchants.length > 0) {
      // Pre-filter to only merchants matching reactivation days
      const reactivationCandidates = canceledMerchants.filter(merchant => {
        const canceledAt = new Date(merchant.updated_at);
        const daysSince = Math.floor((now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24));
        return REACTIVATION_DAYS.includes(daysSince);
      });

      results.reactivation.processed = canceledMerchants.length;
      results.reactivation.skipped = canceledMerchants.length - reactivationCandidates.length;

      if (reactivationCandidates.length > 0) {
        // Batch fetch existing tracking
        const { data: reactivationTrackings } = await supabase
          .from('reactivation_email_tracking')
          .select('merchant_id, day_sent')
          .in('merchant_id', reactivationCandidates.map(m => m.id));

        const reactivationTrackingSet = new Set(
          (reactivationTrackings || []).map(t => `${t.merchant_id}:${t.day_sent}`)
        );

        // Batch fetch user emails
        const reactivationEmailMap = await batchGetUserEmails(
          [...new Set(reactivationCandidates.map(m => m.user_id))]
        );

        // Batch fetch customer counts
        const { data: reactivationCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id')
          .in('merchant_id', reactivationCandidates.map(m => m.id));

        const reactivationCountMap = new Map<string, number>();
        for (const card of reactivationCards || []) {
          reactivationCountMap.set(card.merchant_id, (reactivationCountMap.get(card.merchant_id) || 0) + 1);
        }

        await batchProcess(reactivationCandidates, async (merchant) => {
          const canceledAt = new Date(merchant.updated_at);
          const daysSinceCancellation = Math.floor(
            (now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (reactivationTrackingSet.has(`${merchant.id}:${daysSinceCancellation}`)) {
            results.reactivation.skipped++;
            return;
          }

          const email = reactivationEmailMap.get(merchant.user_id);
          if (!email) { results.reactivation.skipped++; return; }

          const totalCustomers = reactivationCountMap.get(merchant.id) || 0;

          try {
            // Codes promo progressifs : J+14 = 2 mois à 9€, J+30 = 3 mois à 9€
            let promoCode: string | undefined;
            let promoMonths: number | undefined;
            if (daysSinceCancellation === 14) {
              promoCode = 'QARTEBOOST';
              promoMonths = 2;
            } else if (daysSinceCancellation === 30) {
              promoCode = 'QARTELAST';
              promoMonths = 3;
            }
            const result = await sendReactivationEmail(
              email, merchant.shop_name, daysSinceCancellation, totalCustomers || undefined, promoCode, promoMonths
            );
            if (result.success) {
              await supabase.from('reactivation_email_tracking').insert({
                merchant_id: merchant.id,
                day_sent: daysSinceCancellation,
              });
              results.reactivation.sent++;
            } else {
              results.reactivation.errors++;
            }
          } catch {
            results.reactivation.errors++;
          }
        });
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'reactivation', status: 'error', error: String(error) });
  }

  // ==================== SECTION 8: LIFECYCLE EMAILS ====================
  try {
    // ==================== 3b. INCOMPLETE SIGNUP RELANCE (T+24h, T+72h, T+7j) ====================
    {
      // List all auth users without merchants (paginated to handle >500 users)
      let allAuthUsers: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const { data: { users: batch } } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
        allAuthUsers = allAuthUsers.concat(batch || []);
        hasMore = (batch?.length || 0) === 500;
        page++;
      }
      const { data: allMerchantUserIds } = await supabase.from('merchants').select('user_id');
      const merchantUserIdSet = new Set((allMerchantUserIds || []).map((m: { user_id: string }) => m.user_id));
      const { data: superAdminList } = await supabase.from('super_admins').select('user_id');
      const superAdminSet = new Set((superAdminList || []).map((sa: { user_id: string }) => sa.user_id));

      // Check existing tracking to avoid duplicates
      const incompleteUsers = (allAuthUsers || []).filter(u => {
        if (merchantUserIdSet.has(u.id)) return false;
        if (superAdminSet.has(u.id)) return false;
        if (!u.email) return false;
        return true;
      });

      if (incompleteUsers.length > 0) {
        // Fetch tracking for these users (use user id as merchant_id in tracking)
        const { data: existingIncompleteTracking } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, reminder_day')
          .in('merchant_id', incompleteUsers.map(u => u.id))
          .in('reminder_day', [-110, -111, -112]);

        const incompleteTrackingSet = new Set(
          (existingIncompleteTracking || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
        );

        await batchProcess(incompleteUsers, async (user) => {
          results.incompleteRelance.processed++;
          const createdAt = new Date(user.created_at);
          const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          // T+24h (23-25h window)
          if (hoursSince >= 23 && hoursSince <= 25 && !incompleteTrackingSet.has(`${user.id}:-110`)) {
            try {
              const result = await sendGuidedSignupEmail(user.email!);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({ merchant_id: user.id, reminder_day: -110, pending_count: 0 });
                results.incompleteRelance.sent++;
              } else { results.incompleteRelance.errors++; }
            } catch { results.incompleteRelance.errors++; }
            return;
          }

          // T+72h (71-73h window)
          if (hoursSince >= 71 && hoursSince <= 73 && !incompleteTrackingSet.has(`${user.id}:-111`)) {
            try {
              const result = await sendSetupForYouEmail(user.email!);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({ merchant_id: user.id, reminder_day: -111, pending_count: 0 });
                results.incompleteRelance.sent++;
              } else { results.incompleteRelance.errors++; }
            } catch { results.incompleteRelance.errors++; }
            return;
          }

          // T+7j (167-169h window)
          if (hoursSince >= 167 && hoursSince <= 169 && !incompleteTrackingSet.has(`${user.id}:-112`)) {
            try {
              const result = await sendLastChanceSignupEmail(user.email!);
              if (result.success) {
                await supabase.from('pending_email_tracking').insert({ merchant_id: user.id, reminder_day: -112, pending_count: 0 });
                results.incompleteRelance.sent++;
              } else { results.incompleteRelance.errors++; }
            } catch { results.incompleteRelance.errors++; }
            return;
          }

          results.incompleteRelance.skipped++;
        });
      }
    }

    // ==================== 3c. AUTO-SUGGEST REWARD (J+5 merchant, programme non configuré) ====================
    // C7: Idempotent — tracked via pending_email_tracking with code -120
    {
      const oneHundredTwentyOneHoursAgo = new Date(now.getTime() - 121 * 60 * 60 * 1000);
      const oneHundredTwentyHoursAgo = new Date(now.getTime() - 120 * 60 * 60 * 1000);

      const { data: autoSuggestCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, shop_type, user_id, trial_ends_at, subscription_status')
        .is('reward_description', null)
        .in('subscription_status', ['trial', 'active'])
        .lte('created_at', oneHundredTwentyHoursAgo.toISOString())
        .gte('created_at', oneHundredTwentyOneHoursAgo.toISOString())
        .neq('no_contact', true);

      if (autoSuggestCandidates && autoSuggestCandidates.length > 0) {
        const asEmailMap = await batchGetUserEmails([...new Set(autoSuggestCandidates.map(m => m.user_id))]);
        const { data: existingAs } = await supabase.from('pending_email_tracking').select('merchant_id').in('merchant_id', autoSuggestCandidates.map(m => m.id)).eq('reminder_day', -120);
        const alreadySentAs = new Set((existingAs || []).map(t => t.merchant_id));

        await batchProcess(autoSuggestCandidates, async (merchant) => {
          results.autoSuggestReward.processed++;

          if (merchantsSentTrialEmail.has(merchant.id) || alreadySentAs.has(merchant.id)) {
            results.autoSuggestReward.skipped++;
            return;
          }

          const email = asEmailMap.get(merchant.user_id);
          if (!email) { results.autoSuggestReward.skipped++; return; }

          try {
            const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
            const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
            const result = await sendAutoSuggestRewardEmail(email, merchant.shop_name, merchant.shop_type || '', daysRemaining);
            if (result.success) {
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: -120, pending_count: 0 });
              results.autoSuggestReward.sent++;
            }
            else { results.autoSuggestReward.errors++; }
          } catch { results.autoSuggestReward.errors++; }
        });
      }
    }

    // ==================== 3d. GRACE PERIOD SETUP (programme non configuré + grace period) ====================
    {
      const { data: graceCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, trial_ends_at, subscription_status')
        .is('reward_description', null)
        .eq('subscription_status', 'trial')
        .neq('no_contact', true);

      if (graceCandidates && graceCandidates.length > 0) {
        // Check tracking to avoid sending twice
        const { data: existingGrace } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id')
          .in('merchant_id', graceCandidates.map(m => m.id))
          .eq('reminder_day', -113);
        const alreadySentGrace = new Set((existingGrace || []).map(t => t.merchant_id));

        const graceEmailMap = await batchGetUserEmails([...new Set(graceCandidates.map(m => m.user_id))]);

        await batchProcess(graceCandidates, async (merchant) => {
          results.gracePeriodSetup.processed++;

          if (alreadySentGrace.has(merchant.id)) {
            results.gracePeriodSetup.skipped++;
            return;
          }

          const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
          // Only send during grace period (trial expired but not fully expired yet)
          if (!trialStatus.isInGracePeriod) {
            results.gracePeriodSetup.skipped++;
            return;
          }

          const email = graceEmailMap.get(merchant.user_id);
          if (!email) { results.gracePeriodSetup.skipped++; return; }

          try {
            const result = await sendGracePeriodSetupEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion);
            if (result.success) {
              await supabase.from('pending_email_tracking').insert({
                merchant_id: merchant.id, reminder_day: -113, pending_count: 0,
              });
              results.gracePeriodSetup.sent++;
            } else { results.gracePeriodSetup.errors++; }
          } catch { results.gracePeriodSetup.errors++; }
        });
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'lifecycleEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 9: PENDING REMINDERS ====================
  try {
    const { data: merchantsWithPending } = await supabase
      .from('visits')
      .select('merchant_id')
      .eq('status', 'pending')
      .order('merchant_id');

    const uniqueMerchantIds = [...new Set(merchantsWithPending?.map(v => v.merchant_id) || [])];

    if (uniqueMerchantIds.length > 0) {
      // Batch fetch merchant data for all unique IDs (instead of N queries)
      const { data: merchantsData } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id')
        .in('id', uniqueMerchantIds)
        .neq('no_contact', true);

      const merchantMap = new Map(
        (merchantsData || []).map(m => [m.id, m])
      );

      // Batch fetch emails
      const emailMap = await batchGetUserEmails(
        [...new Set((merchantsData || []).map(m => m.user_id))]
      );

      // Batch fetch all pending visits for these merchants (instead of N queries)
      const { data: allPendingVisits } = await supabase
        .from('visits')
        .select('id, merchant_id, visited_at')
        .in('merchant_id', uniqueMerchantIds)
        .eq('status', 'pending')
        .order('visited_at', { ascending: true });

      // Group by merchant_id
      const pendingByMerchant = new Map<string, { id: string; visited_at: string }[]>();
      for (const visit of allPendingVisits || []) {
        if (!pendingByMerchant.has(visit.merchant_id)) {
          pendingByMerchant.set(visit.merchant_id, []);
        }
        pendingByMerchant.get(visit.merchant_id)!.push(visit);
      }

      // Batch fetch existing tracking
      const { data: existingTrackings } = await supabase
        .from('pending_email_tracking')
        .select('merchant_id, reminder_day')
        .in('merchant_id', uniqueMerchantIds);

      const trackingSet = new Set(
        (existingTrackings || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
      );

      await batchProcess(uniqueMerchantIds, async (merchantId) => {
        results.pendingReminders.processed++;

        const merchant = merchantMap.get(merchantId);
        if (!merchant) {
          results.pendingReminders.errors++;
          return;
        }

        const email = emailMap.get(merchant.user_id);
        if (!email) {
          results.pendingReminders.skipped++;
          return;
        }

        const pendingVisits = pendingByMerchant.get(merchantId);
        if (!pendingVisits || pendingVisits.length === 0) {
          results.pendingReminders.skipped++;
          return;
        }

        const pendingCount = pendingVisits.length;
        const oldestPendingDate = new Date(pendingVisits[0].visited_at);
        const daysSinceFirst = Math.floor((now.getTime() - oldestPendingDate.getTime()) / (1000 * 60 * 60 * 24));

        const isInitialAlert = INITIAL_ALERT_DAYS.includes(daysSinceFirst);
        const isReminder = REMINDER_DAYS.includes(daysSinceFirst);

        if (!isInitialAlert && !isReminder) {
          results.pendingReminders.skipped++;
          return;
        }

        if (trackingSet.has(`${merchantId}:${daysSinceFirst}`)) {
          results.pendingReminders.skipped++;
          return;
        }

        try {
          const result = await sendPendingPointsEmail(email, merchant.shop_name, pendingCount, isReminder, isReminder ? daysSinceFirst : undefined);
          if (result.success) {
            await supabase.from('pending_email_tracking').insert({
              merchant_id: merchantId,
              reminder_day: daysSinceFirst,
              pending_count: pendingCount,
            });
            results.pendingReminders.sent++;
          } else {
            results.pendingReminders.errors++;
          }
        } catch {
          results.pendingReminders.errors++;
        }
      });
    }

    // Clean up old tracking
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await supabase.from('pending_email_tracking').delete().lt('sent_at', sevenDaysAgo.toISOString()).gte('reminder_day', 0);

    // C7: Clean up recurring email tracking (trial) older than 8 days so they can be re-sent
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    await supabase.from('pending_email_tracking').delete().lt('sent_at', eightDaysAgo.toISOString()).in('reminder_day', [-201, -203, -211, -212]);

    // Clean up old reactivation tracking (> 60 jours)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    await supabase.from('reactivation_email_tracking').delete().lt('sent_at', sixtyDaysAgo.toISOString());

    // Clean up old demo/tool leads and contact messages (> 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoISO = oneYearAgo.toISOString();
    await supabase.from('demo_leads').delete().lt('created_at', oneYearAgoISO);
    await supabase.from('tool_leads').delete().lt('created_at', oneYearAgoISO);
    await supabase.from('contact_messages').delete().lt('created_at', oneYearAgoISO);
  } catch (error) {
    sectionStatuses.push({ name: 'pendingReminders', status: 'error', error: String(error) });
  }

  // ==================== SECTION 10: SCHEDULED PUSH ====================
  try {
    const today = getTodayInParis();

    const { data: scheduledPushes } = await supabase
      .from('scheduled_push')
      .select('*')
      .eq('scheduled_date', today)
      .eq('scheduled_time', '10:00')
      .eq('status', 'pending');

    for (const push of scheduledPushes || []) {
      results.scheduledPush.processed++;

      try {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('shop_name')
          .eq('id', push.merchant_id)
          .maybeSingle();

        if (!merchant) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

        const { data: loyaltyCards } = await supabase
          .from('loyalty_cards')
          .select('customer_id')
          .eq('merchant_id', push.merchant_id);

        if (!loyaltyCards || loyaltyCards.length === 0) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

        const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];

        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('customer_id', customerIds);

        if (!subscriptions || subscriptions.length === 0) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

        // Send notifications in parallel with Promise.allSettled (was sequential before)
        const pushResults = await Promise.allSettled(
          subscriptions.map(async (sub) => {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: merchant?.shop_name || 'Qarte',
                body: `${push.title}: ${push.body}`,
                icon: '/icon-192.svg',
                url: `/customer/card/${push.merchant_id}`,
                tag: 'qarte-scheduled',
              })
            );
          })
        );

        let sentCount = 0;
        let failedCount = 0;
        const failedEndpoints: string[] = [];

        pushResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            sentCount++;
          } else {
            failedCount++;
            const webPushError = result.reason as { statusCode?: number };
            if (webPushError?.statusCode === 404 || webPushError?.statusCode === 410) {
              failedEndpoints.push(subscriptions[idx].endpoint);
            }
          }
        });

        // Batch delete expired subscriptions
        if (failedEndpoints.length > 0) {
          await supabase.from('push_subscriptions').delete().in('endpoint', failedEndpoints);
        }

        await supabase.from('scheduled_push').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
          failed_count: failedCount,
        }).eq('id', push.id);

        if (sentCount > 0) {
          await supabase.from('push_history').insert({
            merchant_id: push.merchant_id,
            title: push.title,
            body: push.body,
            filter_type: 'scheduled_10h',
            sent_count: sentCount,
            failed_count: failedCount,
          });
        }

        results.scheduledPush.sent++;
      } catch {
        results.scheduledPush.errors++;
        await supabase.from('scheduled_push').update({ status: 'failed' }).eq('id', push.id);
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'scheduledPush', status: 'error', error: String(error) });
  }

  // ==================== SECTION 11: BIRTHDAY VOUCHERS ====================
  try {
    {
      const todayParis = getTodayInParis(); // YYYY-MM-DD in Paris timezone
      const targetDate = new Date(todayParis + 'T12:00:00');
      targetDate.setDate(targetDate.getDate() + 3);
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      const { data: birthdayMerchants } = await supabase
        .from('merchants')
        .select('id, shop_name, birthday_gift_description')
        .eq('birthday_gift_enabled', true)
        .neq('no_contact', true)
        .in('subscription_status', ['trial', 'active']);

      if (birthdayMerchants && birthdayMerchants.length > 0) {
        const merchantIds = birthdayMerchants.map(m => m.id);
        const merchantMap = new Map(birthdayMerchants.map(m => [m.id, m]));

        const { data: birthdayCustomers } = await supabase
          .from('customers')
          .select('id, merchant_id, first_name, phone_number')
          .in('merchant_id', merchantIds)
          .eq('birth_month', targetMonth)
          .eq('birth_day', targetDay);

        if (birthdayCustomers && birthdayCustomers.length > 0) {
          results.birthdayVouchers.processed = birthdayCustomers.length;

          const { data: loyaltyCards } = await supabase
            .from('loyalty_cards')
            .select('id, customer_id, merchant_id')
            .in('customer_id', birthdayCustomers.map(c => c.id))
            .in('merchant_id', merchantIds);

          const cardMap = new Map<string, string>();
          for (const lc of loyaltyCards || []) {
            cardMap.set(`${lc.customer_id}:${lc.merchant_id}`, lc.id);
          }

          // Dedup: check existing birthday vouchers this year
          const currentYear = now.getFullYear();
          const yearStart = new Date(currentYear, 0, 1).toISOString();
          const yearEnd = new Date(currentYear + 1, 0, 1).toISOString();

          const { data: existingBirthdayVouchers } = await supabase
            .from('vouchers')
            .select('customer_id, merchant_id')
            .eq('source', 'birthday')
            .gte('created_at', yearStart)
            .lt('created_at', yearEnd)
            .in('customer_id', birthdayCustomers.map(c => c.id));

          const alreadyHasVoucher = new Set(
            (existingBirthdayVouchers || []).map(v => `${v.customer_id}:${v.merchant_id}`)
          );

          // Pre-fetch phone→customer_ids mapping to avoid N+1
          const birthdayPhones = [...new Set(birthdayCustomers.map((c: any) => c.phone_number))];
          const { data: allPhoneCustomers } = await supabase
            .from('customers')
            .select('id, phone_number')
            .in('phone_number', birthdayPhones);

          const customersByPhone = new Map<string, string[]>();
          for (const c of allPhoneCustomers || []) {
            if (!customersByPhone.has(c.phone_number)) customersByPhone.set(c.phone_number, []);
            customersByPhone.get(c.phone_number)!.push(c.id);
          }

          for (const customer of birthdayCustomers) {
            const key = `${customer.id}:${customer.merchant_id}`;
            const bMerchant = merchantMap.get(customer.merchant_id);
            const loyaltyCardId = cardMap.get(key);

            if (!bMerchant || !loyaltyCardId) {
              results.birthdayVouchers.skipped++;
              continue;
            }

            if (alreadyHasVoucher.has(key)) {
              results.birthdayVouchers.skipped++;
              continue;
            }

            try {
              const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
              const { error: voucherError } = await supabase
                .from('vouchers')
                .insert({
                  loyalty_card_id: loyaltyCardId,
                  merchant_id: customer.merchant_id,
                  customer_id: customer.id,
                  reward_description: bMerchant.birthday_gift_description || 'Cadeau anniversaire',
                  source: 'birthday',
                  expires_at: expiresAt.toISOString(),
                });

              if (voucherError) {
                results.birthdayVouchers.errors++;
                continue;
              }

              results.birthdayVouchers.created++;

              // Push notification (fire-and-forget, dedup by endpoint)
              if (vapidPublicKey && vapidPrivateKey) {
                try {
                  const allCustIds = customersByPhone.get(customer.phone_number) || [];

                  if (allCustIds.length > 0) {
                    const { data: pushSubs } = await supabase
                      .from('push_subscriptions')
                      .select('endpoint, p256dh, auth')
                      .in('customer_id', allCustIds);

                    if (pushSubs && pushSubs.length > 0) {
                      // Dedup by endpoint to avoid sending twice to same device
                      const seen = new Set<string>();
                      const uniqueSubs = pushSubs.filter(sub => {
                        if (seen.has(sub.endpoint)) return false;
                        seen.add(sub.endpoint);
                        return true;
                      });

                      await Promise.allSettled(
                        uniqueSubs.map(async (sub) => {
                          try {
                            await webpush.sendNotification(
                              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                              JSON.stringify({
                                title: bMerchant.shop_name,
                                body: `Joyeux anniversaire bientôt ! 🎂 ${bMerchant.shop_name} vous offre : ${bMerchant.birthday_gift_description || 'un cadeau'}`,
                                icon: '/icon-192.png',
                                url: `/customer/card/${customer.merchant_id}`,
                                tag: `qarte-birthday-${customer.merchant_id}`,
                              })
                            );
                          } catch (pushErr: unknown) {
                            const webPushError = pushErr as { statusCode?: number };
                            if (webPushError?.statusCode === 404 || webPushError?.statusCode === 410) {
                              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                            }
                          }
                        })
                      );
                    }
                  }
                } catch {
                  // Never let push failure crash the cron
                }
              }
            } catch {
              results.birthdayVouchers.errors++;
            }
          }
        }
      }
    }

  } catch (error) {
    sectionStatuses.push({ name: 'birthdayVouchers', status: 'error', error: String(error) });
  }

  // ==================== SECTION 12: PUSH AUTOMATIONS ====================
  try {
    // 12A. Relance inactifs (30+ days no visit)
    {
      const { data: automationMerchants } = await supabase
        .from('push_automations')
        .select('merchant_id, inactive_reminder_offer_text')
        .eq('inactive_reminder_enabled', true);

      if (automationMerchants && automationMerchants.length > 0) {
        const merchantIds = automationMerchants.map(a => a.merchant_id);

        const { data: merchants } = await supabase
          .from('merchants')
          .select('id, shop_name, offer_active, offer_title, offer_expires_at')
          .in('id', merchantIds)
          .in('subscription_status', ['trial', 'active'])
          .neq('no_contact', true);

        for (const merchant of merchants || []) {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { data: inactiveCards } = await supabase
            .from('loyalty_cards')
            .select('customer_id')
            .eq('merchant_id', merchant.id)
            .or(`last_visit_date.lte.${thirtyDaysAgo},last_visit_date.is.null`);

          if (!inactiveCards || inactiveCards.length === 0) continue;

          const customerIds = inactiveCards.map(c => c.customer_id);
          const { data: customers } = await supabase
            .from('customers')
            .select('id, phone_number')
            .in('id', customerIds);

          // Build message: custom offer text > active offer > default
          const automationRow = automationMerchants.find(a => a.merchant_id === merchant.id);
          const customOfferText = automationRow?.inactive_reminder_offer_text;
          const hasOffer = merchant.offer_active && merchant.offer_title &&
            (!merchant.offer_expires_at || new Date(merchant.offer_expires_at) > now);

          for (const customer of customers || []) {
            if (!customer.phone_number) continue;

            const body = customOfferText
              ? customOfferText
              : hasOffer
                ? `${merchant.offer_title} — Profitez-en !`
                : `${merchant.shop_name} vous manque ! Revenez vite.`;

            const sent = await sendAutomationPush({
              supabase,
              merchantId: merchant.id,
              customerId: customer.id,
              customerPhone: customer.phone_number,
              automationType: 'inactive_reminder',
              title: merchant.shop_name,
              body,
              url: `/customer/card/${merchant.id}`,
            });

            if (sent) results.pushAutomations.inactive.sent++;
            else results.pushAutomations.inactive.skipped++;
          }
        }
      }
    }

    // 12B. Rappel récompense (unused voucher 7+ days)
    {
      const { data: automationMerchants } = await supabase
        .from('push_automations')
        .select('merchant_id')
        .eq('reward_reminder_enabled', true);

      if (automationMerchants && automationMerchants.length > 0) {
        const merchantIds = automationMerchants.map(a => a.merchant_id);

        const { data: merchants } = await supabase
          .from('merchants')
          .select('id, shop_name')
          .in('id', merchantIds)
          .in('subscription_status', ['trial', 'active'])
          .neq('no_contact', true);

        const activeMerchantIds = (merchants || []).map(m => m.id);
        const merchantMap = new Map((merchants || []).map(m => [m.id, m]));

        if (activeMerchantIds.length > 0) {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const { data: oldVouchers } = await supabase
            .from('vouchers')
            .select('customer_id, merchant_id')
            .in('merchant_id', activeMerchantIds)
            .eq('is_used', false)
            .lte('created_at', sevenDaysAgo)
            .or(`expires_at.gt.${now.toISOString()},expires_at.is.null`);

          if (oldVouchers && oldVouchers.length > 0) {
            // Deduplicate by customer+merchant
            const seen = new Set<string>();
            const uniqueVouchers = oldVouchers.filter(v => {
              const key = `${v.customer_id}:${v.merchant_id}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            const customerIds = [...new Set(uniqueVouchers.map(v => v.customer_id))];
            const { data: customers } = await supabase
              .from('customers')
              .select('id, phone_number')
              .in('id', customerIds);

            const customerMap = new Map((customers || []).map(c => [c.id, c]));

            for (const voucher of uniqueVouchers) {
              const customer = customerMap.get(voucher.customer_id);
              const vMerchant = merchantMap.get(voucher.merchant_id);
              if (!customer?.phone_number || !vMerchant) continue;

              const sent = await sendAutomationPush({
                supabase,
                merchantId: voucher.merchant_id,
                customerId: voucher.customer_id,
                customerPhone: customer.phone_number,
                automationType: 'reward_reminder',
                title: vMerchant.shop_name,
                body: `Votre récompense vous attend chez ${vMerchant.shop_name} !`,
                url: `/customer/card/${voucher.merchant_id}`,
              });

              if (sent) results.pushAutomations.reward.sent++;
              else results.pushAutomations.reward.skipped++;
            }
          }
        }
      }
    }

    // 12C. Événements (push 7 days before event)
    {
      // Use Paris-local date for event calendar check (avoids off-by-one at midnight)
      const nowParis = new Date(getTodayInParis() + 'T10:00:00');
      const upcomingEvent = getUpcomingEvent(nowParis);

      if (upcomingEvent) {
        const { data: automationMerchants } = await supabase
          .from('push_automations')
          .select('merchant_id, events_offer_text')
          .eq('events_enabled', true)
          .not('events_offer_text', 'is', null);

        if (automationMerchants && automationMerchants.length > 0) {
          const merchantIds = automationMerchants.map(a => a.merchant_id);
          const offerTextMap = new Map(automationMerchants.map(a => [a.merchant_id, a.events_offer_text]));

          const { data: merchants } = await supabase
            .from('merchants')
            .select('id, shop_name')
            .in('id', merchantIds)
            .in('subscription_status', ['trial', 'active'])
            .neq('no_contact', true);

          for (const merchant of merchants || []) {
            const offerText = offerTextMap.get(merchant.id);
            if (!offerText) continue;

            // Get all customers with loyalty cards for this merchant
            const { data: loyaltyCards } = await supabase
              .from('loyalty_cards')
              .select('customer_id')
              .eq('merchant_id', merchant.id);

            if (!loyaltyCards || loyaltyCards.length === 0) continue;

            const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];
            const { data: customers } = await supabase
              .from('customers')
              .select('id, phone_number')
              .in('id', customerIds);

            for (const customer of customers || []) {
              if (!customer.phone_number) continue;

              const sent = await sendAutomationPush({
                supabase,
                merchantId: merchant.id,
                customerId: customer.id,
                customerPhone: customer.phone_number,
                automationType: `event_${upcomingEvent.id}`,
                title: merchant.shop_name,
                body: `C'est bientôt ${upcomingEvent.name} ! ${offerText}`,
                url: `/customer/card/${merchant.id}`,
              });

              if (sent) results.pushAutomations.events.sent++;
              else results.pushAutomations.events.skipped++;
            }
          }
        }
      }
    }

  } catch (error) {
    sectionStatuses.push({ name: 'pushAutomations', status: 'error', error: String(error) });
  }

  // ==================== RESPONSE ====================
  const failedSections = sectionStatuses.filter(s => s.status === 'error');
  if (failedSections.length > 0) {
    logger.error('Morning cron — sections failed', failedSections);
  }
  const hasFailures = failedSections.length > 0;
  logger.info('Morning cron completed', { success: !hasFailures, ...results, sectionStatuses });
  return NextResponse.json(
    { success: !hasFailures, ...results, sectionStatuses },
    { status: hasFailures ? 500 : 200 }
  );
}
