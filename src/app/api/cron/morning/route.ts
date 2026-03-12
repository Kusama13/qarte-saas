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
  sendGuidedSignupEmail,
  sendSetupForYouEmail,
  sendLastChanceSignupEmail,
  sendAutoSuggestRewardEmail,
  sendGracePeriodSetupEmail,
  sendBirthdayNotificationEmail,
} from '@/lib/email';
import { getTrialStatus, getTodayInParis } from '@/lib/utils';
import { sendAutomationPush, getUpcomingEvent } from '@/lib/push-automation';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);
}

// Email schedule for pending reminders
const INITIAL_ALERT_DAYS = [0, 1];
const REMINDER_DAYS = [2, 3];

// Result counters type
type SectionStats = { processed: number; sent: number; skipped: number; errors: number };

// Helper: process items sequentially with 600ms pause between each (Resend rate limit: 2 req/s)
async function batchProcess<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i++) {
    await fn(items[i]);
    // Resend rate limit: 2 req/s — pause apres chaque envoi
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

// Helper: fetch tracking records and build a Set of already-sent merchant IDs
async function getAlreadySentSet(merchantIds: string[], trackingCode: number): Promise<Set<string>> {
  const { data } = await supabase
    .from('pending_email_tracking')
    .select('merchant_id')
    .in('merchant_id', merchantIds)
    .eq('reminder_day', trackingCode);
  return new Set((data || []).map(t => t.merchant_id));
}

// Helper: standard email section — handles the common pattern:
// 1. batchProcess candidates
// 2. Skip if already sent (via alreadySentSet)
// 3. Skip if no email (via emailMap)
// 4. Call sendFn, track on success, count results
// Optional extraSkip: per-candidate custom skip logic (return true to skip)
// Flush tracking records in batches of 100
async function flushTrackingBatch(batch: Array<{ merchant_id: string; reminder_day: number; pending_count: number }>) {
  if (batch.length === 0) return;
  await supabase.from('pending_email_tracking').insert(batch);
}

async function processEmailSection<T extends { id: string; user_id: string }>(opts: {
  candidates: T[];
  trackingCode: number;
  emailMap: Map<string, string>;
  alreadySentSet: Set<string>;
  stats: SectionStats;
  sendFn: (email: string, candidate: T) => Promise<{ success: boolean }>;
  extraSkip?: (candidate: T) => boolean;
  superAdminUserIds?: Set<string>;
}) {
  const { candidates, trackingCode, emailMap, alreadySentSet, stats, sendFn, extraSkip, superAdminUserIds } = opts;
  const trackingBatch: Array<{ merchant_id: string; reminder_day: number; pending_count: number }> = [];

  await batchProcess(candidates, async (candidate) => {
    stats.processed++;

    if (superAdminUserIds?.has(candidate.user_id)) { stats.skipped++; return; }
    if (alreadySentSet.has(candidate.id)) { stats.skipped++; return; }
    if (extraSkip && extraSkip(candidate)) { stats.skipped++; return; }

    const email = emailMap.get(candidate.user_id);
    if (!email) { stats.skipped++; return; }

    try {
      const result = await sendFn(email, candidate);
      if (result.success) {
        trackingBatch.push({ merchant_id: candidate.id, reminder_day: trackingCode, pending_count: 0 });
        if (trackingBatch.length >= 100) {
          await flushTrackingBatch(trackingBatch.splice(0));
        }
        stats.sent++;
      } else { stats.errors++; }
    } catch { stats.errors++; }
  });

  // Flush remaining tracking records
  await flushTrackingBatch(trackingBatch);
}

// Helper: query candidates, fetch tracking, fetch emails, then run processEmailSection
// For sections that follow the full standard pattern end-to-end
async function runStandardEmailSection<T extends { id: string; user_id: string }>(opts: {
  candidates: T[] | null | undefined;
  trackingCode: number;
  stats: SectionStats;
  sendFn: (email: string, candidate: T) => Promise<{ success: boolean }>;
  extraSkip?: (candidate: T) => boolean;
  superAdminUserIds?: Set<string>;
}) {
  const { candidates, trackingCode, stats, sendFn, extraSkip, superAdminUserIds } = opts;
  if (!candidates || candidates.length === 0) return;

  const emailMap = await batchGetUserEmails([...new Set(candidates.map(m => m.user_id))]);
  const alreadySentSet = await getAlreadySentSet(candidates.map(m => m.id), trackingCode);

  await processEmailSection({ candidates, trackingCode, emailMap, alreadySentSet, stats, sendFn, extraSkip, superAdminUserIds });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || !authHeader?.startsWith('Bearer ') ||
      !timingSafeCompare(authHeader.slice(7), CRON_SECRET)) {
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

  // Track section statuses for isolated error handling
  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];

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

  // ==================== 1. TRIAL EMAILS ====================
  // Idempotent — tracked via pending_email_tracking with codes -201/-203 (ending) and -211/-212 (expired)
  // (Custom: multiple tracking codes per merchant, branching logic — kept manual)
  if (isTimedOut()) { sectionStatuses.push({ name: 'trialEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trial')
      .neq('no_contact', true);

    if (merchants && merchants.length > 0) {
      const userIds = [...new Set(merchants.map(m => m.user_id))];
      const emailMap = await batchGetUserEmails(userIds);

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
  // Idempotent — tracked via pending_email_tracking with codes -301/-302/-303
  if (isTimedOut()) { sectionStatuses.push({ name: 'programReminders', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // 2a. PROGRAM REMINDER (J+1)
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

    await runStandardEmailSection({
      candidates: unconfiguredMerchants,
      trackingCode: -301,
      stats: results.programReminders,
      sendFn: (email, m) => sendProgramReminderEmail(email, m.shop_name),
    });

    // 2b. PROGRAM REMINDER (J+2)
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: unconfiguredDay2 } = await supabase
      .from('merchants')
      .select('id, shop_name, shop_type, slug, user_id')
      .is('reward_description', null)
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', fortyEightHoursAgo.toISOString())
      .gte('created_at', fortyNineHoursAgo.toISOString())
      .neq('no_contact', true);

    await runStandardEmailSection({
      candidates: unconfiguredDay2,
      trackingCode: -302,
      stats: results.programRemindersDay2,
      sendFn: (email, m) => sendProgramReminderDay2Email(email, m.shop_name, m.shop_type || '', m.slug),
    });

    // 2c. PROGRAM REMINDER (J+3)
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

    await runStandardEmailSection({
      candidates: unconfiguredDay3,
      trackingCode: -303,
      stats: results.programRemindersDay3,
      extraSkip: (m) => merchantsSentTrialEmail.has(m.id),
      sendFn: (email, m) => {
        const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
        const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
        return sendProgramReminderDay3Email(email, m.shop_name, daysRemaining);
      },
    });
  } catch (error) {
    sectionStatuses.push({ name: 'programReminders', status: 'error', error: String(error) });
  }

  // ==================== SECTION 3: ONBOARDING EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // 2d. DAY 5 CHECKIN (programme configure, J+5)
    // Idempotent — tracked via pending_email_tracking with code -305
    // (Custom: scan count check — uses processEmailSection with extraSkip)
    {
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
        const alreadySentDay5 = await getAlreadySentSet(day5Merchants.map(m => m.id), -305);

        // Get scan counts for these merchants
        const { data: day5Visits } = await supabase
          .from('visits')
          .select('merchant_id')
          .in('merchant_id', day5Merchants.map(m => m.id))
          .eq('status', 'confirmed');

        const scanCountMap = new Map<string, number>();
        for (const v of day5Visits || []) {
          scanCountMap.set(v.merchant_id, (scanCountMap.get(v.merchant_id) || 0) + 1);
        }

        await processEmailSection({
          candidates: day5Merchants,
          trackingCode: -305,
          emailMap,
          alreadySentSet: alreadySentDay5,
          stats: results.day5Checkin,
          extraSkip: (m) => (scanCountMap.get(m.id) || 0) === 0,
          sendFn: (email, m) => sendDay5CheckinEmail(email, m.shop_name, scanCountMap.get(m.id) || 0),
        });
      }
    }

    // 2e. QR CODE + KIT PROMO EMAIL (programme configure, envoi unique)
    {
      const { data: qrCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .neq('no_contact', true);

      if (qrCandidates && qrCandidates.length > 0) {
        const alreadySentQr = await getAlreadySentSet(qrCandidates.map(m => m.id), -103);
        const qrToSend = qrCandidates.filter(m => !alreadySentQr.has(m.id));
        results.qrCode.processed = qrCandidates.length;
        results.qrCode.skipped = qrCandidates.length - qrToSend.length;

        if (qrToSend.length > 0) {
          const qrEmailMap = await batchGetUserEmails([...new Set(qrToSend.map(m => m.user_id))]);

          await processEmailSection({
            candidates: qrToSend,
            trackingCode: -103,
            emailMap: qrEmailMap,
            alreadySentSet: new Set(), // already filtered above
            stats: results.qrCode,
            sendFn: (email, m) => sendQRCodeEmail(
              email, m.shop_name,
              m.reward_description || undefined,
              m.stamps_required, m.primary_color,
              m.logo_url || undefined,
              m.tier2_enabled, m.tier2_stamps_required, m.tier2_reward_description,
              m.loyalty_mode || undefined
            ),
          });
        }
      }
    }

    // 2g. FIRST CLIENT SCRIPT EMAIL (J+2 apres config, 0 scans)
    {
      const { data: scriptCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, shop_type, reward_description, stamps_required, trial_ends_at, subscription_status, loyalty_mode')
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

        const alreadySentScript = await getAlreadySentSet(scriptIds, -106);

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

          await processEmailSection({
            candidates: scriptToSend,
            trackingCode: -106,
            emailMap: scriptEmailMap,
            alreadySentSet: new Set(), // already filtered above
            stats: results.firstClientScript,
            extraSkip: (m) => !m.reward_description,
            sendFn: (email, m) => sendFirstClientScriptEmail(
              email, m.shop_name, m.shop_type || '',
              m.reward_description, m.stamps_required,
              m.loyalty_mode || undefined
            ),
          });
        }
      }
    }

    // 2h. QUICK CHECK EMAIL (J+4 apres config, 0 scans)
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

        const alreadySentQc = await getAlreadySentSet(qcIds, -107);

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

          await processEmailSection({
            candidates: qcToSend,
            trackingCode: -107,
            emailMap: qcEmailMap,
            alreadySentSet: new Set(), // already filtered above
            stats: results.quickCheck,
            sendFn: (email, m) => {
              const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
              const daysRemaining = Math.max(trialStatus.daysRemaining, 1);
              return sendQuickCheckEmail(email, m.shop_name, daysRemaining);
            },
          });
        }
      }
    }
  } catch (error) {
    sectionStatuses.push({ name: 'onboardingEmails', status: 'error', error: String(error) });
  }

  // ==================== SECTION 4: MILESTONE EMAILS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'milestoneEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // 2i. FIRST SCAN EMAIL
    // Merchants with exactly 2 confirmed visits (1st is always merchant's test, 2nd is first real client)
    const { data: allConfiguredMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, referral_code, slug')
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
        await runStandardEmailSection({
          candidates: firstScanMerchants,
          trackingCode: -100,
          stats: results.firstScan,
          sendFn: (email, m) => sendFirstScanEmail(email, m.shop_name, m.referral_code, m.slug),
        });
      }

      // 2f. FIRST REWARD EMAIL
      const { data: merchantsWithProgram } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, reward_description, stamps_required, loyalty_mode')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active'])
        .neq('no_contact', true);

      if (merchantsWithProgram && merchantsWithProgram.length > 0) {
        const programIds = merchantsWithProgram.map(m => m.id);
        const merchantProgramMap = new Map(merchantsWithProgram.map(m => [m.id, m]));

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
          const alreadySentReward = await getAlreadySentSet(firstRewardMerchantIds, -101);

          const rewardEmailMap = await batchGetUserEmails(
            [...new Set(firstRewardMerchantIds
              .filter(id => !alreadySentReward.has(id))
              .map(id => merchantProgramMap.get(id)?.user_id)
              .filter(Boolean) as string[])]
          );

          // This section iterates over IDs, not merchant objects — kept manual for type safety
          await batchProcess(firstRewardMerchantIds, async (merchantId) => {
            results.firstReward.processed++;
            if (alreadySentReward.has(merchantId)) { results.firstReward.skipped++; return; }

            const merchant = merchantProgramMap.get(merchantId);
            if (!merchant) { results.firstReward.skipped++; return; }

            const email = rewardEmailMap.get(merchant.user_id);
            if (!email) { results.firstReward.skipped++; return; }

            if (!merchant.reward_description) { results.firstReward.skipped++; return; }

            try {
              const result = await sendFirstRewardEmail(email, merchant.shop_name, merchant.reward_description, merchant.loyalty_mode === 'cagnotte');
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

      // 2g. TIER 2 UPSELL (50+ clients, tier2 pas active)
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
          const alreadySentTier2 = await getAlreadySentSet(tier2Eligible.map(m => m.id), -102);
          const t2EmailMap = await batchGetUserEmails([...new Set(tier2Eligible.map(m => m.user_id))]);

          await processEmailSection({
            candidates: tier2Eligible,
            trackingCode: -102,
            emailMap: t2EmailMap,
            alreadySentSet: alreadySentTier2,
            stats: results.tier2Upsell,
            extraSkip: (m) => !m.reward_description,
            sendFn: (email, m) => {
              const totalCustomers = customerCountMap.get(m.id) || 0;
              return sendTier2UpsellEmail(email, m.shop_name, totalCustomers, m.reward_description!);
            },
          });
        }
      }
    }
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

    const { data: activeMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, reward_description, stamps_required, created_at, trial_ends_at, subscription_status')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active'])
      .neq('no_contact', true);

    if (activeMerchants && activeMerchants.length > 0) {
      const merchantIds = activeMerchants.map(m => m.id);
      const { data: allLastVisits } = await supabase
        .from('visits')
        .select('merchant_id, visited_at')
        .in('merchant_id', merchantIds)
        .eq('status', 'confirmed')
        .order('visited_at', { ascending: false });

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
        const { data: existingTrackings } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, reminder_day')
          .in('merchant_id', candidateMerchants.map(m => m.id))
          .lt('reminder_day', 0);

        const trackingSet = new Set(
          (existingTrackings || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
        );

        const emailMap = await batchGetUserEmails([...new Set(candidateMerchants.map(m => m.user_id))]);

        await batchProcess(candidateMerchants, async (merchant) => {
          const lastVisitDate = lastVisitMap.get(merchant.id);
          const referenceDate = lastVisitDate ? new Date(lastVisitDate) : new Date(merchant.created_at);
          const daysInactive = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

          const inactiveTrackingCode = daysInactive === 7 ? -110 : daysInactive === 14 ? -111 : -112;
          if (trackingSet.has(`${merchant.id}:${inactiveTrackingCode}`)) {
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
                reminder_day: inactiveTrackingCode,
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
  // (Custom: different tracking table, promo codes, days since cancellation — kept manual)
  if (isTimedOut()) { sectionStatuses.push({ name: 'reactivation', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const REACTIVATION_DAYS = [7, 14, 30];

    const { data: canceledMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, updated_at')
      .eq('subscription_status', 'canceled')
      .neq('no_contact', true);

    if (canceledMerchants && canceledMerchants.length > 0) {
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
          .in('merchant_id', reactivationCandidates.map(m => m.id));

        const reactivationTrackingSet = new Set(
          (reactivationTrackings || []).map(t => `${t.merchant_id}:${t.day_sent}`)
        );

        const reactivationEmailMap = await batchGetUserEmails(
          [...new Set(reactivationCandidates.map(m => m.user_id))]
        );

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
            // Codes promo progressifs : J+14 = 2 mois a 9eur, J+30 = 3 mois a 9eur
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
      const { data: allMerchantUserIds } = await supabase.from('merchants').select('user_id');
      const merchantUserIdSet = new Set((allMerchantUserIds || []).map((m: { user_id: string }) => m.user_id));
      const { data: superAdminList } = await supabase.from('super_admins').select('user_id');
      const superAdminSet = new Set((superAdminList || []).map((sa: { user_id: string }) => sa.user_id));

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
          .in('reminder_day', [-110, -111, -112]);

        const incompleteTrackingSet = new Set(
          (existingIncompleteTracking || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
        );

        // Helper for the 3 incomplete signup email windows
        const incompleteEmailWindows: Array<{
          minHours: number; maxHours: number; trackingCode: number;
          sendFn: (email: string) => Promise<{ success: boolean }>;
        }> = [
          { minHours: 23, maxHours: 25, trackingCode: -110, sendFn: sendGuidedSignupEmail },
          { minHours: 71, maxHours: 73, trackingCode: -111, sendFn: sendSetupForYouEmail },
          { minHours: 167, maxHours: 169, trackingCode: -112, sendFn: sendLastChanceSignupEmail },
        ];

        await batchProcess(incompleteUsers, async (user) => {
          results.incompleteRelance.processed++;
          const createdAt = new Date(user.created_at);
          const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          for (const window of incompleteEmailWindows) {
            if (hoursSince >= window.minHours && hoursSince <= window.maxHours && !incompleteTrackingSet.has(`${user.id}:${window.trackingCode}`)) {
              try {
                const result = await window.sendFn(user.email!);
                if (result.success) {
                  await supabase.from('pending_email_tracking').insert({ merchant_id: user.id, reminder_day: window.trackingCode, pending_count: 0 });
                  results.incompleteRelance.sent++;
                } else { results.incompleteRelance.errors++; }
              } catch { results.incompleteRelance.errors++; }
              return;
            }
          }

          results.incompleteRelance.skipped++;
        });
      }
    }

    // 3c. AUTO-SUGGEST REWARD (J+5 merchant, programme non configure)
    // Idempotent — tracked via pending_email_tracking with code -120
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

      await runStandardEmailSection({
        candidates: autoSuggestCandidates,
        trackingCode: -120,
        stats: results.autoSuggestReward,
        extraSkip: (m) => merchantsSentTrialEmail.has(m.id),
        sendFn: (email, m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
          return sendAutoSuggestRewardEmail(email, m.shop_name, m.shop_type || '', daysRemaining);
        },
      });
    }

    // 3d. GRACE PERIOD SETUP (programme non configure + grace period)
    {
      const { data: graceCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, trial_ends_at, subscription_status')
        .is('reward_description', null)
        .eq('subscription_status', 'trial')
        .neq('no_contact', true);

      await runStandardEmailSection({
        candidates: graceCandidates,
        trackingCode: -113,
        stats: results.gracePeriodSetup,
        extraSkip: (m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          return !trialStatus.isInGracePeriod;
        },
        sendFn: (email, m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          return sendGracePeriodSetupEmail(email, m.shop_name, trialStatus.daysUntilDeletion);
        },
      });
    }
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
      .order('merchant_id');

    const uniqueMerchantIds = [...new Set(merchantsWithPending?.map(v => v.merchant_id) || [])];

    if (uniqueMerchantIds.length > 0) {
      const { data: merchantsData } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id')
        .in('id', uniqueMerchantIds)
        .neq('no_contact', true);

      const merchantMap = new Map(
        (merchantsData || []).map(m => [m.id, m])
      );

      const emailMap = await batchGetUserEmails(
        [...new Set((merchantsData || []).map(m => m.user_id))]
      );

      const { data: allPendingVisits } = await supabase
        .from('visits')
        .select('id, merchant_id, visited_at')
        .in('merchant_id', uniqueMerchantIds)
        .eq('status', 'pending')
        .order('visited_at', { ascending: true });

      const pendingByMerchant = new Map<string, { id: string; visited_at: string }[]>();
      for (const visit of allPendingVisits || []) {
        if (!pendingByMerchant.has(visit.merchant_id)) {
          pendingByMerchant.set(visit.merchant_id, []);
        }
        pendingByMerchant.get(visit.merchant_id)!.push(visit);
      }

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
  } catch (error) {
    sectionStatuses.push({ name: 'pendingReminders', status: 'error', error: String(error) });
  }

  // ==================== SECTION 10: SCHEDULED PUSH ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'scheduledPush', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
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
          .eq('merchant_id', push.merchant_id)
          .limit(5000);

        if (!loyaltyCards || loyaltyCards.length === 0) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

        const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];

        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('customer_id', customerIds)
          .limit(10000);

        if (!subscriptions || subscriptions.length === 0) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

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
  if (isTimedOut()) { sectionStatuses.push({ name: 'birthdayVouchers', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    {
      const todayParis = getTodayInParis(); // YYYY-MM-DD in Paris timezone
      const targetDate = new Date(todayParis + 'T12:00:00');
      targetDate.setDate(targetDate.getDate());
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      const { data: birthdayMerchants } = await supabase
        .from('merchants')
        .select('id, user_id, shop_name, birthday_gift_description')
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

          // Dedup: check existing birthday vouchers this year (use Paris timezone for consistency)
          const currentYear = parseInt(todayParis.split('-')[0], 10);
          const yearStart = `${currentYear}-01-01T00:00:00.000Z`;
          const yearEnd = `${currentYear + 1}-01-01T00:00:00.000Z`;

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

          // Pre-fetch phone->customer_ids mapping to avoid N+1
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

          // Pre-fetch ALL push subscriptions for birthday customers in one query (avoid N+1)
          const allBirthdayCustIds = [...new Set((allPhoneCustomers || []).map(c => c.id))];
          const pushSubsByCustomer = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();
          if (vapidPublicKey && vapidPrivateKey && allBirthdayCustIds.length > 0) {
            const { data: allPushSubs } = await supabase
              .from('push_subscriptions')
              .select('customer_id, endpoint, p256dh, auth')
              .in('customer_id', allBirthdayCustIds);
            for (const sub of allPushSubs || []) {
              if (!pushSubsByCustomer.has(sub.customer_id)) pushSubsByCustomer.set(sub.customer_id, []);
              pushSubsByCustomer.get(sub.customer_id)!.push({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth });
            }
          }

          // Track birthday clients per merchant for merchant notification
          const birthdayByMerchant = new Map<string, string[]>();

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
                  tier: 1,
                  expires_at: expiresAt.toISOString(),
                });

              if (voucherError) {
                results.birthdayVouchers.errors++;
                continue;
              }

              results.birthdayVouchers.created++;

              // Collect client name for merchant notification
              const clientName = customer.first_name || 'Un client';
              if (!birthdayByMerchant.has(customer.merchant_id)) birthdayByMerchant.set(customer.merchant_id, []);
              birthdayByMerchant.get(customer.merchant_id)!.push(clientName);

              // Push notification to customer (fire-and-forget, dedup by endpoint)
              if (vapidPublicKey && vapidPrivateKey) {
                try {
                  const allCustIds = customersByPhone.get(customer.phone_number) || [];
                  const allSubs: Array<{ endpoint: string; p256dh: string; auth: string }> = [];
                  for (const cid of allCustIds) {
                    const subs = pushSubsByCustomer.get(cid);
                    if (subs) allSubs.push(...subs);
                  }

                  if (allSubs.length > 0) {
                    const seen = new Set<string>();
                    const uniqueSubs = allSubs.filter(sub => {
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
                              body: `Joyeux anniversaire ! ${bMerchant.shop_name} vous offre : ${bMerchant.birthday_gift_description || 'un cadeau'}`,
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
                } catch {
                  // Never let push failure crash the cron
                }
              }
            } catch {
              results.birthdayVouchers.errors++;
            }
          }

          // Notify merchants about client birthdays (email, fire-and-forget)
          if (birthdayByMerchant.size > 0) {
            const merchantUserIds = [...birthdayByMerchant.keys()]
              .map(mid => merchantMap.get(mid))
              .filter(Boolean)
              .map(m => m!.user_id);
            const emailMap = await batchGetUserEmails(merchantUserIds);

            for (const [merchantId, clientNames] of birthdayByMerchant) {
              try {
                const bm = merchantMap.get(merchantId);
                if (!bm) continue;
                const merchantEmail = emailMap.get(bm.user_id);
                if (!merchantEmail) continue;

                await sendBirthdayNotificationEmail(
                  merchantEmail,
                  bm.shop_name,
                  clientNames,
                  bm.birthday_gift_description || 'Cadeau anniversaire'
                ).catch(() => {
                  // Never let merchant notification crash the cron
                });
              } catch {
                // Never let merchant notification crash the cron
              }
            }
          }
        }
      }
    }

  } catch (error) {
    sectionStatuses.push({ name: 'birthdayVouchers', status: 'error', error: String(error) });
  }

  // ==================== SECTION 12: PUSH AUTOMATIONS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'pushAutomations', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
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
            .or(`last_visit_date.lte.${thirtyDaysAgo},last_visit_date.is.null`)
            .limit(5000);

          if (!inactiveCards || inactiveCards.length === 0) continue;

          const customerIds = inactiveCards.map(c => c.customer_id);
          const { data: customers } = await supabase
            .from('customers')
            .select('id, phone_number')
            .in('id', customerIds)
            .limit(5000);

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

    // 12B. Rappel recompense (unused voucher 7+ days)
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

    // 12C. Evenements (push 7 days before event)
    {
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

          // Process merchant by merchant to avoid loading all cards + customers at once
          const validMerchants = (merchants || []).filter(m => offerTextMap.get(m.id));

          for (const merchant of validMerchants) {
            if (isTimedOut()) break;

            const offerText = offerTextMap.get(merchant.id);
            if (!offerText) continue;

            // Load cards for this merchant only
            const { data: cards } = await supabase
              .from('loyalty_cards')
              .select('customer_id')
              .eq('merchant_id', merchant.id)
              .limit(5000);

            if (!cards || cards.length === 0) continue;

            const customerIds = [...new Set(cards.map(c => c.customer_id))];
            const { data: customers } = await supabase
              .from('customers')
              .select('id, phone_number')
              .in('id', customerIds)
              .limit(5000);

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
