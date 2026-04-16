export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getTrialStatus, getTodayInParis, getTodayForCountry } from '@/lib/utils';
import { sendAutomationPush, getUpcomingEvent } from '@/lib/push-automation';
import { sendMerchantPush } from '@/lib/merchant-push';
import { sendBookingSms } from '@/lib/sms';
import { verifyCronAuth } from '@/lib/cron-helpers';
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

  const cronStartTime = Date.now();
  const CRON_MAX_TIME_MS = 240 * 1000;
  function isTimedOut() { return Date.now() - cronStartTime > CRON_MAX_TIME_MS; }

  const results = {
    scheduledPush: { processed: 0, sent: 0, errors: 0 },
    pushAutomations: {
      inactive: { sent: 0, skipped: 0, errors: 0 },
      reward: { sent: 0, skipped: 0, errors: 0 },
      events: { sent: 0, skipped: 0, errors: 0 },
    },
    trialPush: { sent: 0 },
    dailyDigest: { sent: 0 },
    birthdayPush: { smsSent: 0, pushSent: 0 },
  };

  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];
  const now = new Date();

  // ==================== PREFETCH ====================
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, shop_type, slug, user_id, locale, country, trial_ends_at, subscription_status, created_at, no_contact, offer_active, offer_title, offer_expires_at, pwa_installed_at, planning_enabled, birthday_gift_enabled, birthday_gift_description, billing_period_start');

  const allMerchantsList = allMerchants || [];
  const allMerchantsMap = new Map(allMerchantsList.map(m => [m.id, m]));

  // ==================== SCHEDULED PUSH (10:00) ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'scheduledPush', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const { data: scheduledPushes } = await supabase
      .from('scheduled_push')
      .select('id, merchant_id, title, body, scheduled_date')
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

        if (push.scheduled_date !== getTodayForCountry(merchant.country)) {
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

        let sentCount = 0;
        let failedCount = 0;
        const failedEndpoints: string[] = [];
        const PUSH_BATCH_SIZE = 100;

        for (let i = 0; i < subscriptions.length; i += PUSH_BATCH_SIZE) {
          const batch = subscriptions.slice(i, i + PUSH_BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async (sub) => {
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

          batchResults.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
              sentCount++;
            } else {
              failedCount++;
              const webPushError = result.reason as { statusCode?: number };
              if (webPushError?.statusCode === 404 || webPushError?.statusCode === 410) {
                failedEndpoints.push(batch[idx].endpoint);
              }
            }
          });
        }

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

  // ==================== PUSH AUTOMATIONS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'pushAutomations', status: 'error', error: 'Skipped: cron timeout' }); }
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

          const validMerchants = eventAutoMerchants.filter(m => offerTextMap.get(m.id));

          for (const merchant of validMerchants) {
            if (isTimedOut()) break;

            const offerText = offerTextMap.get(merchant.id);
            if (!offerText) continue;

            const isEn = merchant.locale === 'en';
            const merchantEvent = isEn ? upcomingEventEn : upcomingEventFr;
            if (!merchantEvent) continue;

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

  // ==================== TRIAL PUSH REMINDERS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'trialPush', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const trialPushMerchants = allMerchantsList.filter(m =>
      (m.subscription_status === 'trial' || m.subscription_status === 'expired') && !m.no_contact
    );

    for (const merchant of trialPushMerchants) {
      const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
      const isEN = merchant.locale === 'en';

      let title: string | null = null;
      let body: string | null = null;
      let refSuffix: string | null = null;

      if (trialStatus.isActive && trialStatus.daysRemaining === 2) {
        title = isEN ? 'Your trial ends in 2 days' : 'Ton essai se termine dans 2 jours';
        body = isEN
          ? 'Subscribe now to keep your clients and bookings.'
          : 'Abonne-toi pour garder tes clients et tes réservations.';
        refSuffix = 'trial-j5';
      }

      if (trialStatus.isActive && trialStatus.daysRemaining <= 0) {
        title = isEN ? 'Your trial ends today' : 'Ton essai se termine aujourd\'hui';
        body = isEN
          ? 'Subscribe to continue using Qarte without interruption.'
          : 'Abonne-toi pour continuer à utiliser Qarte sans interruption.';
        refSuffix = 'trial-j7';
      }

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
        if (sent) results.trialPush.sent++;
      }
    }

    sectionStatuses.push({ name: 'trialPush', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'trialPush', status: 'error', error: String(error) });
  }

  // ==================== DAILY DIGEST (RDV du jour) ====================
  // Each active merchant with planning_enabled gets a push listing today's booking count + first time.
  // Skip if 0 bookings (avoid spam).
  if (isTimedOut()) { sectionStatuses.push({ name: 'dailyDigest', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const digestMerchants = allMerchantsList.filter(m =>
      m.planning_enabled && !m.no_contact && ['trial', 'active', 'canceling', 'past_due'].includes(m.subscription_status)
    );

    if (digestMerchants.length > 0) {
      const todayByMerchant = new Map<string, string>();
      for (const m of digestMerchants) todayByMerchant.set(m.id, getTodayForCountry(m.country));

      const merchantIds = digestMerchants.map(m => m.id);
      const { data: todayBookings } = await supabase
        .from('merchant_planning_slots')
        .select('merchant_id, slot_date, start_time, client_name, primary_slot_id')
        .in('merchant_id', merchantIds)
        .not('client_name', 'is', null)
        .neq('client_name', '__blocked__')
        .is('primary_slot_id', null);

      const bookingsByMerchant = new Map<string, { count: number; firstTime: string }>();
      for (const slot of todayBookings || []) {
        if (slot.slot_date !== todayByMerchant.get(slot.merchant_id)) continue;
        const existing = bookingsByMerchant.get(slot.merchant_id);
        if (!existing) {
          bookingsByMerchant.set(slot.merchant_id, { count: 1, firstTime: slot.start_time });
        } else {
          existing.count++;
          if (slot.start_time < existing.firstTime) existing.firstTime = slot.start_time;
        }
      }

      for (const merchant of digestMerchants) {
        const agg = bookingsByMerchant.get(merchant.id);
        if (!agg || agg.count === 0) continue;

        const isEN = merchant.locale === 'en';
        const today = todayByMerchant.get(merchant.id)!;
        // Format HH:MM:SS → HH:MM
        const firstTimeShort = agg.firstTime.slice(0, 5);
        const title = isEN ? `${agg.count} booking${agg.count > 1 ? 's' : ''} today` : `${agg.count} RDV aujourd'hui`;
        const body = isEN
          ? `First one at ${firstTimeShort}. Have a great day!`
          : `Le premier à ${firstTimeShort}. Bonne journée !`;

        const sent = await sendMerchantPush({
          supabase,
          merchantId: merchant.id,
          notificationType: 'daily_digest',
          referenceId: `${merchant.id}-${today}`,
          title,
          body,
          url: `/dashboard/planning?date=${today}`,
          tag: 'qarte-merchant-digest',
        });
        if (sent) results.dailyDigest.sent++;
      }
    }
    sectionStatuses.push({ name: 'dailyDigest', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'dailyDigest', status: 'error', error: String(error) });
  }

  // ==================== BIRTHDAY (SMS client + push merchant "on lui a envoyé un SMS") ====================
  // For each merchant with birthday_gift_enabled: send SMS to today's birthday clients (dedupe via sms_logs)
  // + group by merchant and send one push "Anniversaire de X — on lui a envoyé un SMS de ta part"
  if (isTimedOut()) { sectionStatuses.push({ name: 'birthdayPush', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    // Only paid merchants — trial users can't send SMS, and the push claims we did
    const bdayMerchants = allMerchantsList.filter(m =>
      m.birthday_gift_enabled === true && !m.no_contact &&
      ['active', 'canceling', 'past_due'].includes(m.subscription_status)
    );

    if (bdayMerchants.length > 0) {
      // Use Paris-anchored "today" (all supported countries FR/BE/CH are in Europe/Paris-adjacent zones)
      const todayParis = getTodayInParis();
      const [, monthStr, dayStr] = todayParis.split('-');
      const targetMonth = parseInt(monthStr, 10);
      const targetDay = parseInt(dayStr, 10);

      const merchantIds = bdayMerchants.map(m => m.id);
      const merchantMap = new Map(bdayMerchants.map(m => [m.id, m]));

      const { data: bdayCustomers } = await supabase
        .from('customers')
        .select('id, merchant_id, first_name, phone_number')
        .in('merchant_id', merchantIds)
        .eq('birth_month', targetMonth)
        .eq('birth_day', targetDay);

      if (bdayCustomers && bdayCustomers.length > 0) {
        const byMerchant = new Map<string, string[]>();
        for (const c of bdayCustomers) {
          // Send SMS (sendBookingSms handles dedup via sms_logs — safe if morning-jobs also runs today)
          if (c.phone_number) {
            const m = merchantMap.get(c.merchant_id);
            if (!m) continue;
            const smsSent = await sendBookingSms(supabase, {
              merchantId: m.id,
              phone: c.phone_number,
              shopName: m.shop_name,
              smsType: 'birthday',
              locale: m.locale || 'fr',
              subscriptionStatus: m.subscription_status,
              gift: m.birthday_gift_description || (m.locale === 'en' ? 'a gift' : 'un cadeau'),
              clientName: c.first_name || '',
            });
            if (smsSent) results.birthdayPush.smsSent++;
          }
          if (!byMerchant.has(c.merchant_id)) byMerchant.set(c.merchant_id, []);
          byMerchant.get(c.merchant_id)!.push(c.first_name || (merchantMap.get(c.merchant_id)?.locale === 'en' ? 'a client' : 'un(e) client(e)'));
        }

        // One grouped push per merchant
        for (const [merchantId, names] of byMerchant) {
          const m = merchantMap.get(merchantId);
          if (!m) continue;
          const isEN = m.locale === 'en';
          const list = names.slice(0, 3).join(', ');
          const extra = names.length > 3 ? (isEN ? ` +${names.length - 3}` : ` +${names.length - 3}`) : '';
          const title = isEN
            ? (names.length > 1 ? `${names.length} birthdays today 🎂` : 'Birthday today 🎂')
            : (names.length > 1 ? `${names.length} anniversaires aujourd'hui 🎂` : `Anniversaire aujourd'hui 🎂`);
          const body = isEN
            ? `We sent ${names.length > 1 ? 'them' : list} an SMS on your behalf — ${list}${extra}`
            : `On ${names.length > 1 ? 'leur' : 'lui'} a envoyé un SMS de ta part — ${list}${extra}`;

          const sent = await sendMerchantPush({
            supabase,
            merchantId,
            notificationType: 'birthday_digest',
            referenceId: `${merchantId}-${todayParis}`,
            title,
            body,
            url: '/dashboard/customers',
            tag: 'qarte-merchant-birthday',
          });
          if (sent) results.birthdayPush.pushSent++;
        }
      }
    }
    sectionStatuses.push({ name: 'birthdayPush', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'birthdayPush', status: 'error', error: String(error) });
  }

  // ==================== RESPONSE ====================
  const elapsedMs = Date.now() - cronStartTime;
  const failedSections = sectionStatuses.filter(s => s.status === 'error');
  if (failedSections.length > 0) {
    logger.error('Morning-push cron — sections failed', failedSections);
  }
  const hasFailures = failedSections.length > 0;
  logger.info('Morning-push cron completed', { success: !hasFailures, elapsedMs, ...results, sectionStatuses });
  return NextResponse.json(
    { success: !hasFailures, elapsedMs, ...results, sectionStatuses },
    { status: hasFailures ? 500 : 200 }
  );
}
