import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { sendPendingPointsEmail, sendTrialEndingEmail, sendTrialExpiredEmail, sendProgramReminderEmail, sendIncompleteSignupEmail } from '@/lib/email';
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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    incompleteSignups: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    trialEmails: { processed: 0, ending: 0, expired: 0, errors: 0 },
    programReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    pendingReminders: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    scheduledPush: { processed: 0, sent: 0, errors: 0 },
  };

  try {
    // ==================== 0. INCOMPLETE SIGNUPS (auth sans merchant, 2-3h) ====================
    // Récupérer les utilisateurs auth créés il y a 2-3h sans merchant
    const threeHoursAgo = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);

    // Lister les users récents via Supabase Auth Admin
    const { data: { users: recentUsers } } = await supabase.auth.admin.listUsers({
      perPage: 100,
    });

    if (recentUsers) {
      for (const authUser of recentUsers) {
        const createdAt = new Date(authUser.created_at);
        // Only users created between 3h and 2h ago
        if (createdAt < threeHoursAgo || createdAt > twoHoursAgo) continue;
        if (!authUser.email) continue;

        results.incompleteSignups.processed++;

        // Check if merchant exists for this user
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (merchant) {
          results.incompleteSignups.skipped++;
          continue;
        }

        // No merchant → send incomplete signup email
        try {
          const result = await sendIncompleteSignupEmail(authUser.email);
          if (result.success) {
            results.incompleteSignups.sent++;
          } else {
            results.incompleteSignups.errors++;
          }
        } catch {
          results.incompleteSignups.errors++;
        }
      }
    }

    // ==================== 1. TRIAL EMAILS ====================
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trial');

    for (const merchant of merchants || []) {
      results.trialEmails.processed++;
      const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) continue;

      try {
        if (trialStatus.isActive && (trialStatus.daysRemaining === 3 || trialStatus.daysRemaining === 1)) {
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
    }

    // ==================== 2. PROGRAM REMINDER (J+1) ====================
    // Merchants inscrits il y a ~24h qui n'ont pas configuré leur programme
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

    for (const merchant of unconfiguredMerchants || []) {
      results.programReminders.processed++;

      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        results.programReminders.skipped++;
        continue;
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
    }

    // ==================== 3. PENDING REMINDERS ====================
    const { data: merchantsWithPending } = await supabase
      .from('visits')
      .select('merchant_id')
      .eq('status', 'pending')
      .order('merchant_id');

    const uniqueMerchantIds = [...new Set(merchantsWithPending?.map(v => v.merchant_id) || [])];

    for (const merchantId of uniqueMerchantIds) {
      results.pendingReminders.processed++;

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id')
        .eq('id', merchantId)
        .single();

      if (!merchant) {
        results.pendingReminders.errors++;
        continue;
      }

      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        results.pendingReminders.skipped++;
        continue;
      }

      const { data: pendingVisits } = await supabase
        .from('visits')
        .select('id, visited_at')
        .eq('merchant_id', merchantId)
        .eq('status', 'pending')
        .order('visited_at', { ascending: true });

      if (!pendingVisits || pendingVisits.length === 0) {
        results.pendingReminders.skipped++;
        continue;
      }

      const pendingCount = pendingVisits.length;
      const oldestPendingDate = new Date(pendingVisits[0].visited_at);
      const now = new Date();
      const daysSinceFirst = Math.floor((now.getTime() - oldestPendingDate.getTime()) / (1000 * 60 * 60 * 24));

      const isInitialAlert = INITIAL_ALERT_DAYS.includes(daysSinceFirst);
      const isReminder = REMINDER_DAYS.includes(daysSinceFirst);

      if (!isInitialAlert && !isReminder) {
        results.pendingReminders.skipped++;
        continue;
      }

      const { data: existingTracking } = await supabase
        .from('pending_email_tracking')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('reminder_day', daysSinceFirst)
        .single();

      if (existingTracking) {
        results.pendingReminders.skipped++;
        continue;
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
        // Get merchant info
        const { data: merchant } = await supabase
          .from('merchants')
          .select('shop_name')
          .eq('id', push.merchant_id)
          .single();

        // Get subscribers
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

        // Send notifications
        let sentCount = 0;
        let failedCount = 0;

        for (const sub of subscriptions) {
          try {
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
            sentCount++;
          } catch (err) {
            failedCount++;
            const webPushError = err as { statusCode?: number };
            if (webPushError.statusCode === 404 || webPushError.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
          }
        }

        // Update scheduled push status
        await supabase.from('scheduled_push').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
          failed_count: failedCount,
        }).eq('id', push.id);

        // Add to push history
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
