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
  sendWeeklyDigestEmail,
  sendTier2UpsellEmail,
  sendReactivationEmail,
  sendFirstClientScriptEmail,
  sendQuickCheckEmail,
} from '@/lib/email';
import { getTrialStatus } from '@/lib/utils';
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
    weeklyDigest: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    tier2Upsell: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    inactiveMerchants: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    reactivation: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    pendingReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    scheduledPush: { processed: 0, sent: 0, errors: 0 },
  };

  try {
    // ==================== 1. TRIAL EMAILS ====================
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trial');

    if (merchants && merchants.length > 0) {
      // Batch fetch all user emails upfront
      const userIds = [...new Set(merchants.map(m => m.user_id))];
      const emailMap = await batchGetUserEmails(userIds);

      await batchProcess(merchants, async (merchant) => {
        results.trialEmails.processed++;
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        const email = emailMap.get(merchant.user_id);

        if (!email) return;

        try {
          if (trialStatus.isActive && (trialStatus.daysRemaining === 3 || trialStatus.daysRemaining === 1)) {
            // Pas de code promo à J-1 : on laisse convertir au prix normal
            await sendTrialEndingEmail(email, merchant.shop_name, trialStatus.daysRemaining);
            results.trialEmails.ending++;
          }
          if (trialStatus.isInGracePeriod) {
            const daysExpired = Math.abs(trialStatus.daysRemaining);
            if (daysExpired === 1 || daysExpired === 2) {
              // Code promo QARTE50 uniquement à J+1 (1er email après expiration)
              const promoCode = daysExpired === 1 ? 'QARTE50' : undefined;
              await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion, promoCode);
              results.trialEmails.expired++;
            }
          }
        } catch {
          results.trialEmails.errors++;
        }
      });
    }

    // ==================== 2. PROGRAM REMINDER (J+1) ====================
    const now = new Date();
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: unconfiguredMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id')
      .is('reward_description', null)
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', twentyFourHoursAgo.toISOString())
      .gte('created_at', twentyFiveHoursAgo.toISOString());

    if (unconfiguredMerchants && unconfiguredMerchants.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(unconfiguredMerchants.map(m => m.user_id))]);

      await batchProcess(unconfiguredMerchants, async (merchant) => {
        results.programReminders.processed++;
        const email = emailMap.get(merchant.user_id);

        if (!email) {
          results.programReminders.skipped++;
          return;
        }

        try {
          const result = await sendProgramReminderEmail(email, merchant.shop_name);
          if (result.success) {
            results.programReminders.sent++;
          } else {
            results.programReminders.errors++;
          }
        } catch {
          results.programReminders.errors++;
        }
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
      .gte('created_at', fortyNineHoursAgo.toISOString());

    if (unconfiguredDay2 && unconfiguredDay2.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(unconfiguredDay2.map(m => m.user_id))]);

      await batchProcess(unconfiguredDay2, async (merchant) => {
        results.programRemindersDay2.processed++;
        const email = emailMap.get(merchant.user_id);

        if (!email) {
          results.programRemindersDay2.skipped++;
          return;
        }

        try {
          const result = await sendProgramReminderDay2Email(email, merchant.shop_name, merchant.shop_type || '');
          if (result.success) {
            results.programRemindersDay2.sent++;
          } else {
            results.programRemindersDay2.errors++;
          }
        } catch {
          results.programRemindersDay2.errors++;
        }
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
      .gte('created_at', seventyThreeHoursAgo.toISOString());

    if (unconfiguredDay3 && unconfiguredDay3.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(unconfiguredDay3.map(m => m.user_id))]);

      await batchProcess(unconfiguredDay3, async (merchant) => {
        results.programRemindersDay3.processed++;
        const email = emailMap.get(merchant.user_id);

        if (!email) {
          results.programRemindersDay3.skipped++;
          return;
        }

        try {
          const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
          const daysRemaining = Math.max(trialStatus.daysRemaining, 0);
          const result = await sendProgramReminderDay3Email(email, merchant.shop_name, daysRemaining);
          if (result.success) {
            results.programRemindersDay3.sent++;
          } else {
            results.programRemindersDay3.errors++;
          }
        } catch {
          results.programRemindersDay3.errors++;
        }
      });
    }

    // ==================== 2d. DAY 5 CHECKIN (programme configuré, J+5) ====================
    const oneTwentyOneHoursAgo = new Date(now.getTime() - 121 * 60 * 60 * 1000);
    const oneTwentyHoursAgo = new Date(now.getTime() - 120 * 60 * 60 * 1000);

    const { data: day5Merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active'])
      .lte('created_at', oneTwentyHoursAgo.toISOString())
      .gte('created_at', oneTwentyOneHoursAgo.toISOString());

    if (day5Merchants && day5Merchants.length > 0) {
      const emailMap = await batchGetUserEmails([...new Set(day5Merchants.map(m => m.user_id))]);

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
        const email = emailMap.get(merchant.user_id);
        if (!email) { results.day5Checkin.skipped++; return; }

        try {
          const totalScans = scanCountMap.get(merchant.id) || 0;
          // Skip for 0-scan merchants — covered by FirstClientScript (J+2) and QuickCheck (J+4)
          if (totalScans === 0) { results.day5Checkin.skipped++; return; }
          const result = await sendDay5CheckinEmail(email, merchant.shop_name, totalScans);
          if (result.success) { results.day5Checkin.sent++; }
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
        .in('subscription_status', ['trial', 'active']);

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

    // ==================== 2g. FIRST CLIENT SCRIPT EMAIL (J+2 après config, 0 scans) ====================
    {
      // Find merchants who got QR code email exactly 2 days ago
      const { data: scriptCandidates } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, shop_type, reward_description, stamps_required, trial_ends_at, subscription_status')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active']);

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

            try {
              const result = await sendFirstClientScriptEmail(
                email, merchant.shop_name, merchant.shop_type || '',
                merchant.reward_description!, merchant.stamps_required
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
        .in('subscription_status', ['trial', 'active']);

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

    // ==================== 2i. FIRST SCAN EMAIL ====================
    // Merchants with exactly 2 confirmed visits (1st is always merchant's test, 2nd is first real client)
    const { data: allConfiguredMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, referral_code')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active']);

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
        .in('subscription_status', ['trial', 'active']);

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

            try {
              const result = await sendFirstRewardEmail(email, merchant.shop_name, merchant.reward_description!);
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
        .or('tier2_enabled.is.null,tier2_enabled.eq.false');

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
              const result = await sendTier2UpsellEmail(email, merchant.shop_name, totalCustomers, merchant.reward_description!);
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

    // ==================== 2h. WEEKLY DIGEST (lundi matin) ====================
    const dayOfWeek = now.getUTCDay(); // 0 = dimanche, 1 = lundi
    if (dayOfWeek === 1) {
      const { data: digestMerchants } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id')
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['trial', 'active']);

      if (digestMerchants && digestMerchants.length > 0) {
        const digestIds = digestMerchants.map(m => m.id);
        const sevenDaysAgoDigest = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get this week's visits
        const { data: weekVisits } = await supabase
          .from('visits')
          .select('merchant_id, customer_id, visited_at')
          .in('merchant_id', digestIds)
          .eq('status', 'confirmed')
          .gte('visited_at', sevenDaysAgoDigest.toISOString());

        // Get total customers and rewards earned this week
        const { data: allCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id, customer_id, rewards_earned, created_at')
          .in('merchant_id', digestIds);

        // Build stats per merchant
        const weekStats = new Map<string, { scans: number; newCustomers: number; rewards: number; totalCustomers: number }>();
        for (const m of digestMerchants) {
          weekStats.set(m.id, { scans: 0, newCustomers: 0, rewards: 0, totalCustomers: 0 });
        }

        for (const v of weekVisits || []) {
          const stats = weekStats.get(v.merchant_id);
          if (stats) stats.scans++;
        }

        for (const card of allCards || []) {
          const stats = weekStats.get(card.merchant_id);
          if (!stats) continue;
          stats.totalCustomers++;
          if (new Date(card.created_at) >= sevenDaysAgoDigest) {
            stats.newCustomers++;
          }
        }

        // Count rewards earned this week (approximate via visits where customer reached threshold)
        const { data: merchantPrograms } = await supabase
          .from('merchants')
          .select('id, stamps_required')
          .in('id', digestIds);

        const stampsMap = new Map((merchantPrograms || []).map(m => [m.id, m.stamps_required]));

        for (const card of allCards || []) {
          const stats = weekStats.get(card.merchant_id);
          if (stats && card.rewards_earned > 0) {
            stats.rewards += card.rewards_earned;
          }
        }

        const digestEmailMap = await batchGetUserEmails([...new Set(digestMerchants.map(m => m.user_id))]);

        await batchProcess(digestMerchants, async (merchant) => {
          results.weeklyDigest.processed++;
          const email = digestEmailMap.get(merchant.user_id);
          if (!email) { results.weeklyDigest.skipped++; return; }

          const stats = weekStats.get(merchant.id);
          if (!stats) { results.weeklyDigest.skipped++; return; }

          try {
            const result = await sendWeeklyDigestEmail(
              email, merchant.shop_name,
              stats.scans, stats.newCustomers, stats.rewards, stats.totalCustomers
            );
            if (result.success) { results.weeklyDigest.sent++; }
            else { results.weeklyDigest.errors++; }
          } catch { results.weeklyDigest.errors++; }
        });
      }
    }

    // ==================== 3. INACTIVE MERCHANTS (programme configuré, 0 check-in) ====================
    const INACTIVE_DAYS = [7, 14, 30];

    const { data: activeMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, reward_description, stamps_required, created_at, trial_ends_at, subscription_status')
      .not('reward_description', 'is', null)
      .neq('reward_description', '')
      .in('subscription_status', ['trial', 'active']);

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

    // ==================== 3. REACTIVATION (merchants annulés) ====================
    const REACTIVATION_DAYS = [7, 14, 30];

    const { data: canceledMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, updated_at')
      .eq('subscription_status', 'canceled');

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

    // ==================== 4. PENDING REMINDERS ====================
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
        .in('id', uniqueMerchantIds);

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

    // Clean up old reactivation tracking (> 60 jours)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    await supabase.from('reactivation_email_tracking').delete().lt('sent_at', sixtyDaysAgo.toISOString());

    // ==================== 4. SCHEDULED PUSH 10:00 ====================
    const today = new Date().toISOString().split('T')[0];

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
          .single();

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

    logger.info('Morning cron completed', results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    logger.error('Morning cron error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
