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
    // Note: Incomplete signup emails are now handled via Resend scheduledAt (1h after Phase 1)
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

    for (const merchant of unconfiguredDay2 || []) {
      results.programRemindersDay2.processed++;
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        results.programRemindersDay2.skipped++;
        continue;
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

    for (const merchant of unconfiguredDay3 || []) {
      results.programRemindersDay3.processed++;
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        results.programRemindersDay3.skipped++;
        continue;
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
    }

    // ==================== 2d. INACTIVE MERCHANTS (programme configuré, 0 check-in) ====================
    const INACTIVE_DAYS = [7, 14, 30];

    const { data: activeMerchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, reward_description, stamps_required')
      .not('reward_description', 'is', null)
      .in('subscription_status', ['trial', 'active']);

    for (const merchant of activeMerchants || []) {
      results.inactiveMerchants.processed++;

      // Trouver la dernière visite validée
      const { data: lastVisit } = await supabase
        .from('visits')
        .select('visited_at')
        .eq('merchant_id', merchant.id)
        .eq('status', 'validated')
        .order('visited_at', { ascending: false })
        .limit(1)
        .single();

      // Calculer les jours d'inactivité
      let daysInactive: number;
      if (!lastVisit) {
        // Aucune visite validée — compter depuis la date de création du merchant
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('created_at')
          .eq('id', merchant.id)
          .single();
        if (!merchantData) {
          results.inactiveMerchants.skipped++;
          continue;
        }
        daysInactive = Math.floor((now.getTime() - new Date(merchantData.created_at).getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysInactive = Math.floor((now.getTime() - new Date(lastVisit.visited_at).getTime()) / (1000 * 60 * 60 * 24));
      }

      if (!INACTIVE_DAYS.includes(daysInactive)) {
        results.inactiveMerchants.skipped++;
        continue;
      }

      // Vérifier si déjà envoyé via pending_email_tracking (réutilise la même table)
      const { data: existingTracking } = await supabase
        .from('pending_email_tracking')
        .select('id')
        .eq('merchant_id', merchant.id)
        .eq('reminder_day', -daysInactive) // Valeurs négatives pour les distinguer des pending reminders
        .single();

      if (existingTracking) {
        results.inactiveMerchants.skipped++;
        continue;
      }

      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        results.inactiveMerchants.skipped++;
        continue;
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
            reminder_day: -daysInactive, // Valeurs négatives pour distinguer
            pending_count: 0,
          });
          results.inactiveMerchants.sent++;
        } else {
          results.inactiveMerchants.errors++;
        }
      } catch {
        results.inactiveMerchants.errors++;
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
