export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getTodayForCountry } from '@/lib/utils';
import { sendMerchantPush } from '@/lib/merchant-push';
import { sendBookingSms, getGlobalSmsConfig } from '@/lib/sms';
import { resend, EMAIL_FROM, EMAIL_HEADERS } from '@/lib/resend';
import { verifyCronAuth, rateLimitDelay } from '@/lib/cron-helpers';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@getqarte.com', vapidPublicKey, vapidPrivateKey);
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    sent: 0,
    errors: 0,
  };

  try {
    // Fetch all pending 18:00 pushes (no date filter — checked per merchant timezone)
    const { data: scheduledPushes } = await supabase
      .from('scheduled_push')
      .select('id, merchant_id, title, body, scheduled_date')
      .eq('scheduled_time', '18:00')
      .eq('status', 'pending');

    // Batch fetch all merchants, loyalty cards, and push subscriptions upfront (avoid N+1)
    const pushMerchantIds = [...new Set((scheduledPushes || []).map(p => p.merchant_id))];
    const [{ data: allMerchants }, { data: allCards }, { data: allSubs }] = await Promise.all([
      supabase.from('merchants').select('id, shop_name, country, locale').in('id', pushMerchantIds),
      supabase.from('loyalty_cards').select('merchant_id, customer_id').in('merchant_id', pushMerchantIds),
      supabase.from('push_subscriptions').select('*').in('merchant_id', pushMerchantIds),
    ]);

    const merchantMap = new Map((allMerchants || []).map(m => [m.id, m]));
    const cardsByMerchant = new Map<string, Set<string>>();
    for (const card of allCards || []) {
      if (!cardsByMerchant.has(card.merchant_id)) cardsByMerchant.set(card.merchant_id, new Set());
      cardsByMerchant.get(card.merchant_id)!.add(card.customer_id);
    }
    const subsByCustomer = new Map<string, NonNullable<typeof allSubs>>();
    for (const sub of allSubs || []) {
      if (!subsByCustomer.has(sub.customer_id)) subsByCustomer.set(sub.customer_id, []);
      subsByCustomer.get(sub.customer_id)!.push(sub);
    }

    for (const push of scheduledPushes || []) {
      results.processed++;

      try {
        const merchant = merchantMap.get(push.merchant_id);

        if (!merchant) {
          await supabase.from('scheduled_push').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0 }).eq('id', push.id);
          continue;
        }

        // Check if scheduled_date matches "today" in merchant's timezone
        if (push.scheduled_date !== getTodayForCountry(merchant.country)) {
          continue; // Not yet "today" for this merchant — skip, will be caught on next run
        }

        const customerIdSet = cardsByMerchant.get(push.merchant_id);
        if (!customerIdSet || customerIdSet.size === 0) {
          await supabase.from('scheduled_push').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_count: 0
          }).eq('id', push.id);
          continue;
        }

        // Collect subscriptions for this merchant's customers
        const subscriptions: NonNullable<typeof allSubs> = [];
        for (const custId of customerIdSet) {
          const custSubs = subsByCustomer.get(custId);
          if (custSubs) subscriptions.push(...custSubs);
        }

        if (!subscriptions || subscriptions.length === 0) {
          await supabase.from('scheduled_push').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_count: 0
          }).eq('id', push.id);
          continue;
        }

        // Send notifications in parallel with Promise.allSettled (was sequential)
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
            filter_type: 'scheduled_19h',
            sent_count: sentCount,
            failed_count: failedCount,
          });
        }

        results.sent++;
      } catch {
        results.errors++;
        await supabase.from('scheduled_push').update({ status: 'failed' }).eq('id', push.id);
      }
    }

    // ── DEPOSIT DEADLINE — WARNING ONLY ──
    // Actual release is handled by the hourly /api/cron/deposit-expiration cron.
    const nowIso = new Date().toISOString();
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const { data: expiringSlots } = await supabase
      .from('merchant_planning_slots')
      .select('id, merchant_id, client_name, slot_date, start_time')
      .eq('deposit_confirmed', false)
      .not('deposit_deadline_at', 'is', null)
      .gte('deposit_deadline_at', nowIso)
      .lte('deposit_deadline_at', fourHoursFromNow)
      .is('primary_slot_id', null)
      .limit(200);

    const warningMerchantIds = [...new Set((expiringSlots || []).map(s => s.merchant_id))];
    const { data: warnMerchants } = warningMerchantIds.length > 0
      ? await supabase.from('merchants').select('id, locale').in('id', warningMerchantIds)
      : { data: [] };
    const warnMerchantMap = new Map((warnMerchants || []).map(m => [m.id, m]));

    const depositPushes: Promise<boolean>[] = [];
    let depositWarned = 0;
    for (const slot of expiringSlots || []) {
      const isEN = warnMerchantMap.get(slot.merchant_id)?.locale === 'en';
      depositPushes.push(sendMerchantPush({
        supabase, merchantId: slot.merchant_id, notificationType: 'deposit_expiring', referenceId: slot.id,
        title: isEN ? 'Deposit expiring soon' : 'Acompte bientôt expiré',
        body: isEN
          ? `${slot.client_name} — confirm or the slot will be released`
          : `${slot.client_name} — confirme ou le créneau sera libéré`,
        url: `/dashboard/planning?date=${slot.slot_date}`, tag: 'qarte-merchant-deposit',
      }));
      depositWarned++;
    }

    if (depositPushes.length > 0) await Promise.allSettled(depositPushes);

    // ── SMS REMINDERS (J-1, 19h) — cap 200 SMS/run ──
    const SMS_CAP = 200;
    const smsResults = { sent: 0, skipped: 0, errors: 0 };

    try {
      const globalSmsConfig = await getGlobalSmsConfig(supabase);

      if (globalSmsConfig.reminder_enabled) {
        const { data: smsMerchants } = await supabase
          .from('merchants')
          .select('id, shop_name, country, locale, subscription_status, reminder_j1_enabled, planning_enabled')
          .in('subscription_status', ['active', 'canceling', 'past_due'])
          .eq('reminder_j1_enabled', true)
          .eq('planning_enabled', true);

        const activeMerchants = smsMerchants || [];

        for (const m of activeMerchants) {
          if (smsResults.sent >= SMS_CAP) break;

          const today = getTodayForCountry(m.country);
          const todayDate = new Date(today + 'T12:00:00');
          const tomorrowDate = new Date(todayDate);
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

          const { data: tomorrowSlots } = await supabase
            .from('merchant_planning_slots')
            .select('id, client_phone, start_time, slot_date')
            .eq('merchant_id', m.id)
            .eq('slot_date', tomorrowStr)
            .not('client_name', 'is', null)
            .not('client_phone', 'is', null)
            .is('primary_slot_id', null);

          for (const slot of tomorrowSlots || []) {
            if (smsResults.sent >= SMS_CAP) break;
            if (!slot.client_phone) { smsResults.skipped++; continue; }

            const sent = await sendBookingSms(supabase, {
              merchantId: m.id,
              slotId: slot.id,
              phone: slot.client_phone,
              shopName: m.shop_name,
              date: slot.slot_date,
              time: slot.start_time,
              smsType: 'reminder_j1',
              locale: m.locale || 'fr',
              subscriptionStatus: m.subscription_status,
              globalConfig: globalSmsConfig,
            });

            if (sent) smsResults.sent++;
            else smsResults.skipped++;

            await rateLimitDelay();
          }
        }
      }
    } catch (smsError) {
      smsResults.errors++;
      logger.error('SMS reminders error:', smsError);
    }

    logger.info('Evening cron completed', { ...results, depositWarned, smsReminders: smsResults });
    return NextResponse.json({ success: true, ...results, depositWarned, smsReminders: smsResults });
  } catch (error) {
    logger.error('Evening cron error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
