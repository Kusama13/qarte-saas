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
  sendAutoSuggestRewardEmail,
  sendGracePeriodSetupEmail,
  sendBirthdayNotificationEmail,
} from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { getTrialStatus, getTodayInParis, getTodayForCountry } from '@/lib/utils';
import { sendAutomationPush, getUpcomingEvent } from '@/lib/push-automation';
import { sendMerchantPush } from '@/lib/merchant-push';
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

// Resend rate limit: 2 req/s — 600ms pause between actual sends only
const RESEND_RATE_LIMIT_MS = 600;
const rateLimitDelay = () => new Promise(resolve => setTimeout(resolve, RESEND_RATE_LIMIT_MS));

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
// 1. Iterate candidates, skip already-sent/no-email/extraSkip
// 2. Call sendFn, track on success, count results, rate-limit delay
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

  for (const candidate of candidates) {
    stats.processed++;

    if (superAdminUserIds?.has(candidate.user_id)) { stats.skipped++; continue; }
    if (alreadySentSet.has(candidate.id)) { stats.skipped++; continue; }
    if (extraSkip && extraSkip(candidate)) { stats.skipped++; continue; }

    const email = emailMap.get(candidate.user_id);
    if (!email) { stats.skipped++; continue; }

    try {
      const result = await sendFn(email, candidate);
      if (result.success) {
        trackingBatch.push({ merchant_id: candidate.id, reminder_day: trackingCode, pending_count: 0 });
        if (trackingBatch.length >= 100) {
          await flushTrackingBatch(trackingBatch.splice(0));
        }
        stats.sent++;
        // Resend rate limit: 2 req/s — pause only after actual send
        await rateLimitDelay();
      } else { stats.errors++; }
    } catch { stats.errors++; }
  }

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
  emailMap?: Map<string, string>;
  globalTrackingSet?: Set<string>;
}) {
  const { candidates, trackingCode, stats, sendFn, extraSkip, superAdminUserIds } = opts;
  if (!candidates || candidates.length === 0) return;

  const emailMap = opts.emailMap || await batchGetUserEmails([...new Set(candidates.map(m => m.user_id))]);
  const alreadySentSet = opts.globalTrackingSet
    ? new Set(candidates.filter(m => opts.globalTrackingSet!.has(`${m.id}:${trackingCode}`)).map(m => m.id))
    : await getAlreadySentSet(candidates.map(m => m.id), trackingCode);

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

  // ==================== PREFETCH: merchants, emails, tracking ====================
  // Single fetch for all merchants — sections filter in JS instead of separate DB queries
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, shop_type, slug, user_id, locale, country, trial_ends_at, subscription_status, created_at, updated_at, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode, referral_code, no_contact, birthday_gift_enabled, birthday_gift_description, offer_active, offer_title, offer_expires_at');

  const allMerchantsList = allMerchants || [];
  const allMerchantsMap = new Map(allMerchantsList.map(m => [m.id, m]));

  // Parallel fetch: user emails + tracking records
  const allUserIds = [...new Set(allMerchantsList.map(m => m.user_id))];
  const allMerchantIds = allMerchantsList.map(m => m.id);

  // Fetch all tracking records — paginate to avoid Supabase 1000-row default limit
  async function fetchAllTracking(merchantIds: string[]) {
    const allRows: Array<{ merchant_id: string; reminder_day: number }> = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from('pending_email_tracking')
        .select('merchant_id, reminder_day')
        .in('merchant_id', merchantIds)
        .range(offset, offset + PAGE_SIZE - 1);
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    return allRows;
  }

  const [globalEmailMap, allTracking] = await Promise.all([
    batchGetUserEmails(allUserIds),
    fetchAllTracking(allMerchantIds),
  ]);

  const globalTrackingSet = new Set(
    allTracking.map(t => `${t.merchant_id}:${t.reminder_day}`)
  );

  // Pre-computed merchant filters — reused across multiple sections
  const configuredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description !== null && m.reward_description !== '' &&
    ['trial', 'active'].includes(m.subscription_status) && !m.no_contact
  );
  const unconfiguredActiveMerchants = allMerchantsList.filter(m =>
    m.reward_description === null &&
    ['trial', 'active'].includes(m.subscription_status) && !m.no_contact
  );

  // ==================== 1. TRIAL EMAILS ====================
  // Idempotent — tracked via pending_email_tracking with codes -201/-203 (ending) and -211/-212 (expired)
  // (Custom: multiple tracking codes per merchant, branching logic — kept manual)
  if (isTimedOut()) { sectionStatuses.push({ name: 'trialEmails', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const trialMerchants = allMerchantsList.filter(m => m.subscription_status === 'trial' && !m.no_contact);

    if (trialMerchants.length > 0) {
      for (const merchant of trialMerchants) {
        results.trialEmails.processed++;
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        const email = globalEmailMap.get(merchant.user_id);

        if (!email) continue;

        try {
          if (trialStatus.isActive && (trialStatus.daysRemaining === 3 || trialStatus.daysRemaining === 1)) {
            const trackCode = trialStatus.daysRemaining === 3 ? -203 : -201;
            if (globalTrackingSet.has(`${merchant.id}:${trackCode}`)) continue;
            await sendTrialEndingEmail(email, merchant.shop_name, trialStatus.daysRemaining, undefined, (merchant.locale as EmailLocale) || 'fr');
            await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
            results.trialEmails.ending++;
            merchantsSentTrialEmail.add(merchant.id);
            await rateLimitDelay();
          }
          if (trialStatus.isInGracePeriod) {
            const daysExpired = Math.abs(trialStatus.daysRemaining);
            if (daysExpired === 1 || daysExpired === 2) {
              const trackCode = daysExpired === 1 ? -211 : -212;
              if (globalTrackingSet.has(`${merchant.id}:${trackCode}`)) continue;
              const promoCode = daysExpired === 1 ? 'QARTE50' : undefined;
              await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion, promoCode, (merchant.locale as EmailLocale) || 'fr');
              await supabase.from('pending_email_tracking').insert({ merchant_id: merchant.id, reminder_day: trackCode, pending_count: 0 });
              results.trialEmails.expired++;
              merchantsSentTrialEmail.add(merchant.id);
              await rateLimitDelay();
            }
          }
        } catch {
          results.trialEmails.errors++;
        }
      }
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

    const unconfiguredMerchants = unconfiguredActiveMerchants.filter(m =>
      m.created_at <= twentyFourHoursAgo.toISOString() && m.created_at >= twentyFiveHoursAgo.toISOString()
    );

    await runStandardEmailSection({
      candidates: unconfiguredMerchants,
      trackingCode: -301,
      stats: results.programReminders,
      sendFn: (email, m) => sendProgramReminderEmail(email, m.shop_name, (m.locale as EmailLocale) || 'fr'),
      emailMap: globalEmailMap,
      globalTrackingSet,
    });

    // 2b. PROGRAM REMINDER (J+2)
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const unconfiguredDay2 = unconfiguredActiveMerchants.filter(m =>
      m.created_at <= fortyEightHoursAgo.toISOString() && m.created_at >= fortyNineHoursAgo.toISOString()
    );

    await runStandardEmailSection({
      candidates: unconfiguredDay2,
      trackingCode: -302,
      stats: results.programRemindersDay2,
      sendFn: (email, m) => sendProgramReminderDay2Email(email, m.shop_name, m.shop_type || '', m.slug, (m.locale as EmailLocale) || 'fr'),
      emailMap: globalEmailMap,
      globalTrackingSet,
    });

    // 2c. PROGRAM REMINDER (J+3)
    const seventyThreeHoursAgo = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const unconfiguredDay3 = unconfiguredActiveMerchants.filter(m =>
      m.created_at <= seventyTwoHoursAgo.toISOString() && m.created_at >= seventyThreeHoursAgo.toISOString()
    );

    await runStandardEmailSection({
      candidates: unconfiguredDay3,
      trackingCode: -303,
      stats: results.programRemindersDay3,
      extraSkip: (m) => merchantsSentTrialEmail.has(m.id),
      sendFn: (email, m) => {
        const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
        const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
        return sendProgramReminderDay3Email(email, m.shop_name, daysRemaining, (m.locale as EmailLocale) || 'fr');
      },
      emailMap: globalEmailMap,
      globalTrackingSet,
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

      const day5Merchants = configuredActiveMerchants.filter(m =>
        m.created_at <= oneTwentyHoursAgo.toISOString() && m.created_at >= oneTwentyOneHoursAgo.toISOString()
      );

      if (day5Merchants.length > 0) {
        const alreadySentDay5 = new Set(day5Merchants.filter(m => globalTrackingSet.has(`${m.id}:-305`)).map(m => m.id));

        // Get scan counts for these merchants
        const { data: day5Visits } = await supabase
          .from('visits')
          .select('merchant_id')
          .in('merchant_id', day5Merchants.map(m => m.id))
          .eq('status', 'confirmed')
          .limit(10000);

        const scanCountMap = new Map<string, number>();
        for (const v of day5Visits || []) {
          scanCountMap.set(v.merchant_id, (scanCountMap.get(v.merchant_id) || 0) + 1);
        }

        await processEmailSection({
          candidates: day5Merchants,
          trackingCode: -305,
          emailMap: globalEmailMap,
          alreadySentSet: alreadySentDay5,
          stats: results.day5Checkin,
          extraSkip: (m) => (scanCountMap.get(m.id) || 0) === 0,
          sendFn: (email, m) => sendDay5CheckinEmail(email, m.shop_name, scanCountMap.get(m.id) || 0, (m.locale as EmailLocale) || 'fr'),
        });
      }
    }

    // 2e. QR CODE + KIT PROMO EMAIL (programme configure, envoi unique)
    {
      const qrCandidates = configuredActiveMerchants;

      if (qrCandidates.length > 0) {
        const qrToSend = qrCandidates.filter(m => !globalTrackingSet.has(`${m.id}:-103`));
        results.qrCode.processed = qrCandidates.length;
        results.qrCode.skipped = qrCandidates.length - qrToSend.length;

        if (qrToSend.length > 0) {
          await processEmailSection({
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
          await processEmailSection({
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
        }
      }
    }

    // 2h. QUICK CHECK EMAIL (J+4 apres config, 0 scans)
    {
      const qcCandidates = configuredActiveMerchants;

      if (qcCandidates.length > 0) {
        const qcIds = qcCandidates.map(m => m.id);

        // Check who got QR code email ~4 days ago
        const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const { data: qrTrackings4 } = await supabase
          .from('pending_email_tracking')
          .select('merchant_id, sent_at')
          .in('merchant_id', qcIds)
          .eq('reminder_day', -103)
          .limit(5000);

        const qrSent4DaysAgo = new Set(
          (qrTrackings4 || [])
            .filter(t => {
              const sentAt = new Date(t.sent_at);
              return sentAt <= fourDaysAgo && sentAt >= fiveDaysAgo;
            })
            .map(t => t.merchant_id)
        );

        const alreadySentQc = new Set(qcIds.filter(id => globalTrackingSet.has(`${id}:-107`)));

        // Check who has visits
        const { data: qcVisits } = await supabase
          .from('visits')
          .select('merchant_id')
          .in('merchant_id', qcIds)
          .eq('status', 'confirmed')
          .limit(10000);
        const qcHasVisits = new Set((qcVisits || []).map(v => v.merchant_id));

        const qcToSend = qcCandidates.filter(
          m => qrSent4DaysAgo.has(m.id) && !alreadySentQc.has(m.id) && !qcHasVisits.has(m.id)
        );

        results.quickCheck.processed = qcCandidates.length;
        results.quickCheck.skipped = qcCandidates.length - qcToSend.length;

        if (qcToSend.length > 0) {
          await processEmailSection({
            candidates: qcToSend,
            trackingCode: -107,
            emailMap: globalEmailMap,
            alreadySentSet: new Set(), // already filtered above
            stats: results.quickCheck,
            sendFn: (email, m) => {
              const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
              const daysRemaining = Math.max(trialStatus.daysRemaining, 1);
              return sendQuickCheckEmail(email, m.shop_name, daysRemaining, (m.locale as EmailLocale) || 'fr');
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
    const allConfiguredMerchants = configuredActiveMerchants;

    if (allConfiguredMerchants.length > 0) {
      const configuredIds = allConfiguredMerchants.map(m => m.id);

      // Get visit counts per merchant
      const { data: visitCounts } = await supabase
        .from('visits')
        .select('merchant_id')
        .in('merchant_id', configuredIds)
        .eq('status', 'confirmed')
        .limit(50000);

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
          sendFn: (email, m) => sendFirstScanEmail(email, m.shop_name, m.referral_code, m.slug, (m.locale as EmailLocale) || 'fr'),
          emailMap: globalEmailMap,
          globalTrackingSet,
        });
      }

      // 2f. FIRST REWARD EMAIL
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

          await processEmailSection({
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
            } else {
              results.inactiveMerchants.errors++;
            }
          } catch {
            results.inactiveMerchants.errors++;
          }
        }
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

    const canceledMerchants = allMerchantsList.filter(m => m.subscription_status === 'canceled' && !m.no_contact);

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
              email, merchant.shop_name, daysSinceCancellation, totalCustomers || undefined, promoCode, promoMonths, (merchant.locale as EmailLocale) || 'fr'
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
          .in('reminder_day', [-110, -111, -112]);

        const incompleteTrackingSet = new Set(
          (existingIncompleteTracking || []).map(t => `${t.merchant_id}:${t.reminder_day}`)
        );

        // Incomplete signup: only 1 cron email at T+24h (T+1h is scheduled via Resend at signup)
        const incompleteEmailWindows: Array<{
          minHours: number; maxHours: number; trackingCode: number;
          sendFn: (email: string) => Promise<{ success: boolean }>;
        }> = [
          { minHours: 23, maxHours: 25, trackingCode: -110, sendFn: sendGuidedSignupEmail },
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

    // 3c. AUTO-SUGGEST REWARD (J+5 merchant, programme non configure)
    // Idempotent — tracked via pending_email_tracking with code -120
    {
      const oneHundredTwentyOneHoursAgo = new Date(now.getTime() - 121 * 60 * 60 * 1000);
      const oneHundredTwentyHoursAgo = new Date(now.getTime() - 120 * 60 * 60 * 1000);

      const autoSuggestCandidates = unconfiguredActiveMerchants.filter(m =>
        m.created_at <= oneHundredTwentyHoursAgo.toISOString() && m.created_at >= oneHundredTwentyOneHoursAgo.toISOString()
      );

      await runStandardEmailSection({
        candidates: autoSuggestCandidates,
        trackingCode: -120,
        stats: results.autoSuggestReward,
        extraSkip: (m) => merchantsSentTrialEmail.has(m.id),
        sendFn: (email, m) => {
          const trialStatus = getTrialStatus(m.trial_ends_at, m.subscription_status);
          const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
          return sendAutoSuggestRewardEmail(email, m.shop_name, m.shop_type || '', daysRemaining, (m.locale as EmailLocale) || 'fr');
        },
        emailMap: globalEmailMap,
        globalTrackingSet,
      });
    }

    // 3d. GRACE PERIOD SETUP (programme non configure + grace period)
    {
      const graceCandidates = allMerchantsList.filter(m =>
        m.reward_description === null && m.subscription_status === 'trial' && !m.no_contact
      );

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
          return sendGracePeriodSetupEmail(email, m.shop_name, trialStatus.daysUntilDeletion, (m.locale as EmailLocale) || 'fr');
        },
        emailMap: globalEmailMap,
        globalTrackingSet,
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
      .order('merchant_id')
      .limit(10000);

    const uniqueMerchantIds = [...new Set(merchantsWithPending?.map(v => v.merchant_id) || [])];

    if (uniqueMerchantIds.length > 0) {
      const pendingMerchantMap = new Map(
        uniqueMerchantIds
          .map(id => allMerchantsMap.get(id))
          .filter((m): m is NonNullable<typeof m> => m != null && !m.no_contact)
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
  } catch (error) {
    sectionStatuses.push({ name: 'pendingReminders', status: 'error', error: String(error) });
  }

  // ==================== SECTION 10: SCHEDULED PUSH ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'scheduledPush', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    // Fetch all pending 10:00 pushes (no date filter — checked per merchant timezone)
    const { data: scheduledPushes } = await supabase
      .from('scheduled_push')
      .select('*')
      .eq('scheduled_time', '10:00')
      .eq('status', 'pending');

    for (const push of scheduledPushes || []) {
      results.scheduledPush.processed++;

      try {
        const merchant = allMerchantsMap.get(push.merchant_id);

        if (!merchant) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

        // Check if scheduled_date matches "today" in merchant's timezone
        if (push.scheduled_date !== getTodayForCountry(merchant.country)) {
          continue; // Not yet "today" for this merchant — skip, will be caught on next run
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
      const todayParis = getTodayInParis(); // YYYY-MM-DD fallback for birthday query
      const targetDate = new Date(todayParis + 'T12:00:00');
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      const birthdayMerchants = allMerchantsList.filter(m =>
        m.birthday_gift_enabled === true && !m.no_contact &&
        ['trial', 'active'].includes(m.subscription_status)
      );

      if (birthdayMerchants.length > 0) {
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

            // Verify birthday matches "today" in merchant's timezone (edge case: timezone date differs from Paris)
            const merchantToday = getTodayForCountry(bMerchant.country);
            const mDate = new Date(merchantToday + 'T12:00:00');
            if (mDate.getMonth() + 1 !== targetMonth || mDate.getDate() !== targetDay) {
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
                              body: bMerchant.locale === 'en'
                                ? `Happy birthday! ${bMerchant.shop_name} offers you: ${bMerchant.birthday_gift_description || 'a gift'}`
                                : `Joyeux anniversaire ! ${bMerchant.shop_name} vous offre : ${bMerchant.birthday_gift_description || 'un cadeau'}`,
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

          // Notify merchants about client birthdays (email + push, fire-and-forget)
          if (birthdayByMerchant.size > 0) {
            for (const [merchantId, clientNames] of birthdayByMerchant) {
              try {
                const bm = merchantMap.get(merchantId);
                if (!bm) continue;
                const merchantEmail = globalEmailMap.get(bm.user_id);
                if (merchantEmail) {
                  await sendBirthdayNotificationEmail(
                    merchantEmail,
                    bm.shop_name,
                    clientNames,
                    bm.birthday_gift_description || 'Cadeau anniversaire',
                    (bm.locale as EmailLocale) || 'fr'
                  ).catch(() => {});
                }

                // Push notification to merchant
                const bodyText = clientNames.length === 1
                  ? `${clientNames[0]} fête son anniversaire aujourd'hui`
                  : `${clientNames.join(', ')} fêtent leur anniversaire aujourd'hui`;
                sendMerchantPush({
                  supabase,
                  merchantId,
                  notificationType: 'birthday_digest',
                  referenceId: `${merchantId}-${todayParis}`,
                  title: `🎂 ${clientNames.length} anniversaire${clientNames.length > 1 ? 's' : ''} aujourd'hui`,
                  body: bodyText,
                  url: '/dashboard/planning',
                  tag: 'qarte-merchant-birthday',
                }).catch(() => {});
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
        const automationMap = new Map(automationMerchants.map(a => [a.merchant_id, a]));

        const inactiveAutoMerchants = automationMerchants
          .map(a => allMerchantsMap.get(a.merchant_id))
          .filter((m): m is NonNullable<typeof m> => m != null && !m.no_contact && ['trial', 'active'].includes(m.subscription_status));

        for (const merchant of inactiveAutoMerchants) {
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

          const automationRow = automationMap.get(merchant.id);
          const customOfferText = automationRow?.inactive_reminder_offer_text;
          const hasOffer = merchant.offer_active && merchant.offer_title &&
            (!merchant.offer_expires_at || new Date(merchant.offer_expires_at) > now);
          const isEn = merchant.locale === 'en';

          for (const customer of customers || []) {
            if (!customer.phone_number) continue;

            const body = customOfferText
              ? customOfferText
              : hasOffer
                ? isEn
                  ? `${merchant.offer_title} — Don't miss out!`
                  : `${merchant.offer_title} — Profitez-en !`
                : isEn
                  ? `${merchant.shop_name} misses you! Come back soon.`
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
        const rewardAutoMerchants = automationMerchants
          .map(a => allMerchantsMap.get(a.merchant_id))
          .filter((m): m is NonNullable<typeof m> => m != null && !m.no_contact && ['trial', 'active'].includes(m.subscription_status));

        const activeMerchantIds = rewardAutoMerchants.map(m => m.id);
        const merchantMap = new Map(rewardAutoMerchants.map(m => [m.id, m]));

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
                body: vMerchant.locale === 'en'
                  ? `Your reward is waiting at ${vMerchant.shop_name}!`
                  : `Votre récompense vous attend chez ${vMerchant.shop_name} !`,
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
      // Check both FR and EN events (different Mother's Day dates)
      const upcomingEventFr = getUpcomingEvent(nowParis, 'fr');
      const upcomingEventEn = getUpcomingEvent(nowParis, 'en');

      if (upcomingEventFr || upcomingEventEn) {
        const { data: automationMerchants } = await supabase
          .from('push_automations')
          .select('merchant_id, events_offer_text')
          .eq('events_enabled', true)
          .not('events_offer_text', 'is', null);

        if (automationMerchants && automationMerchants.length > 0) {
          const offerTextMap = new Map(automationMerchants.map(a => [a.merchant_id, a.events_offer_text]));

          const eventAutoMerchants = automationMerchants
            .map(a => allMerchantsMap.get(a.merchant_id))
            .filter((m): m is NonNullable<typeof m> => m != null && !m.no_contact && ['trial', 'active'].includes(m.subscription_status));

          // Process merchant by merchant to avoid loading all cards + customers at once
          const validMerchants = eventAutoMerchants.filter(m => offerTextMap.get(m.id));

          for (const merchant of validMerchants) {
            if (isTimedOut()) break;

            const offerText = offerTextMap.get(merchant.id);
            if (!offerText) continue;

            // Pick the right event for this merchant's locale
            const isEn = merchant.locale === 'en';
            const merchantEvent = isEn ? upcomingEventEn : upcomingEventFr;
            if (!merchantEvent) continue;

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
                automationType: `event_${merchantEvent.id}`,
                title: merchant.shop_name,
                body: isEn
                  ? `${merchantEvent.name} is coming soon! ${offerText}`
                  : `C'est bientôt ${merchantEvent.name} ! ${offerText}`,
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

  // ==================== SECTION 13: MERCHANT PUSH — TRIAL REMINDERS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'trialPush', status: 'error', error: 'Skipped: cron timeout (240s)' }); }
  else try {
    const trialPushMerchants = allMerchantsList.filter(m =>
      (m.subscription_status === 'trial' || m.subscription_status === 'expired') && !m.no_contact
    );

    let trialPushSent = 0;

    for (const merchant of trialPushMerchants) {
      const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
      const isEN = merchant.locale === 'en';

      let title: string | null = null;
      let body: string | null = null;
      let refSuffix: string | null = null;

      // J+5 : 2 jours avant fin d'essai
      if (trialStatus.isActive && trialStatus.daysRemaining === 2) {
        title = isEN ? 'Your trial ends in 2 days' : 'Ton essai se termine dans 2 jours';
        body = isEN
          ? 'Subscribe now to keep your clients and bookings.'
          : 'Abonne-toi pour garder tes clients et tes réservations.';
        refSuffix = 'trial-j5';
      }

      // J+7 : dernier jour
      if (trialStatus.isActive && trialStatus.daysRemaining <= 0) {
        title = isEN ? 'Your trial ends today' : 'Ton essai se termine aujourd\'hui';
        body = isEN
          ? 'Subscribe to continue using Qarte without interruption.'
          : 'Abonne-toi pour continuer à utiliser Qarte sans interruption.';
        refSuffix = 'trial-j7';
      }

      // J+8 : grace period jour 1
      if (trialStatus.isInGracePeriod && Math.abs(trialStatus.daysRemaining) === 1) {
        title = isEN ? 'Your trial has ended' : 'Ton essai est terminé';
        body = isEN
          ? `You have ${trialStatus.daysUntilDeletion} days left before losing your data. Subscribe now.`
          : `Il te reste ${trialStatus.daysUntilDeletion} jours avant la perte de tes données. Abonne-toi maintenant.`;
        refSuffix = 'trial-j8';
      }

      if (title && body && refSuffix) {
        const sent = await sendMerchantPush({
          supabase,
          merchantId: merchant.id,
          notificationType: 'trial_reminder',
          referenceId: `${merchant.id}-${refSuffix}`,
          title,
          body,
          url: '/dashboard/subscription',
          tag: 'qarte-merchant-trial',
        });
        if (sent) trialPushSent++;
      }
    }

    sectionStatuses.push({ name: 'trialPush', status: 'ok', sent: trialPushSent } as never);
  } catch (error) {
    sectionStatuses.push({ name: 'trialPush', status: 'error', error: String(error) });
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
