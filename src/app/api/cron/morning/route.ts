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

// Helper: process items in parallel batches
async function batchProcess<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  batchSize = 5
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(fn));
  }
}

// Helper: batch fetch user emails by user_id
async function batchGetUserEmails(userIds: string[]): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  await batchProcess(userIds, async (userId) => {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (email) emailMap.set(userId, email);
  }, 10);
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
    inactiveMerchants: { processed: 0, sent: 0, skipped: 0, errors: 0 },
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
          if (trialStatus.isActive && (trialStatus.daysRemaining === 5 || trialStatus.daysRemaining === 3 || trialStatus.daysRemaining === 1)) {
            await sendTrialEndingEmail(email, merchant.shop_name, trialStatus.daysRemaining);
            results.trialEmails.ending++;
          }
          if (trialStatus.isInGracePeriod) {
            const daysExpired = Math.abs(trialStatus.daysRemaining);
            if (daysExpired === 1 || daysExpired === 3 || daysExpired === 5) {
              await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion);
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

    // ==================== 2d. INACTIVE MERCHANTS (programme configuré, 0 check-in) ====================
    const INACTIVE_DAYS = [7, 14, 30];

    const { data: activeMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, reward_description, stamps_required, created_at')
      .not('reward_description', 'is', null)
      .in('subscription_status', ['trial', 'active']);

    if (activeMerchants && activeMerchants.length > 0) {
      // Batch fetch last visits for ALL active merchants in one query (instead of N queries)
      const merchantIds = activeMerchants.map(m => m.id);
      const { data: allLastVisits } = await supabase
        .from('visits')
        .select('merchant_id, visited_at')
        .in('merchant_id', merchantIds)
        .eq('status', 'validated')
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

    // ==================== 3. PENDING REMINDERS ====================
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
    await supabase.from('pending_email_tracking').delete().lt('sent_at', sevenDaysAgo.toISOString());

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
