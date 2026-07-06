export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getTodayInParis, getTodayForCountry } from '@/lib/utils';
import { sendBirthdayNotificationEmail } from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { sendMerchantPush } from '@/lib/merchant-push';
import { sendBookingSms } from '@/lib/sms';
import { isLegalSendTime } from '@/lib/sms-compliance';
import { resend, EMAIL_FROM, EMAIL_HEADERS } from '@/lib/resend';
import { verifyCronAuth, batchGetUserEmails, rateLimitDelay } from '@/lib/cron-helpers';
import { sendFollowupDepositReminders } from '@/lib/followup-reminders';
import { creditBookingLoyalty } from '@/lib/booking-loyalty';
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
    birthdayVouchers: { processed: 0, created: 0, skipped: 0, errors: 0 },
    depositDeadline: { released: 0, warned: 0 },
    attendanceAutoMarked: { count: 0, creditedLoyalty: 0 },
    contestPrizeReminder: { processed: 0, alerted: 0 },
    googleReviewsCachePurge: { deleted: 0 },
    followupDepositReminders: { processed: 0, remindersSent: 0, errors: 0 },
  };

  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];
  const pushPromises: Promise<boolean>[] = [];
  const now = new Date();

  // ==================== PREFETCH ====================
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, country, subscription_status, past_due_since, no_contact, birthday_gift_enabled, birthday_gift_description, pwa_installed_at, email_bounced_at, email_unsubscribed_at')
    .is('deleted_at', null);

  const allMerchantsList = allMerchants || [];
  const allMerchantsMap = new Map(allMerchantsList.map(m => [m.id, m]));

  // ==================== BIRTHDAY VOUCHERS ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'birthdayVouchers', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const todayParis = getTodayInParis();
    const targetDate = new Date(todayParis + 'T12:00:00');
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();

    const birthdayMerchants = allMerchantsList.filter(m =>
      m.birthday_gift_enabled === true && !m.no_contact && !m.email_bounced_at && !m.email_unsubscribed_at &&
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

        // Dedup: check existing birthday vouchers this year
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

        // Build phone->customer_ids mapping from already-fetched birthday customers (no extra query)
        const customersByPhone = new Map<string, string[]>();
        for (const c of birthdayCustomers) {
          if (!c.phone_number) continue;
          if (!customersByPhone.has(c.phone_number)) customersByPhone.set(c.phone_number, []);
          customersByPhone.get(c.phone_number)!.push(c.id);
        }

        // Pre-fetch ALL push subscriptions for birthday customers in one query
        const allBirthdayCustIds = [...new Set(birthdayCustomers.map(c => c.id))];
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

          // Verify birthday matches "today" in merchant's timezone
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

            // Push notification to customer
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
                              ? `${customer.first_name ? customer.first_name + ', happy' : 'Happy'} birthday! ${bMerchant.shop_name} offers you: ${bMerchant.birthday_gift_description || 'a gift'}`
                              : `${customer.first_name ? customer.first_name + ', joyeux' : 'Joyeux'} anniversaire ! ${bMerchant.shop_name} vous offre : ${bMerchant.birthday_gift_description || 'un cadeau'}`,
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

            // SMS birthday — respecte la plage légale FR (10h-20h). Fallback via sms-hourly à 10h local si skip ici.
            if (customer.phone_number && isLegalSendTime(now, bMerchant.country || 'FR').ok) {
              sendBookingSms(supabase, {
                merchantId: customer.merchant_id,
                phone: customer.phone_number,
                shopName: bMerchant.shop_name,
                smsType: 'birthday',
                locale: bMerchant.locale || 'fr',
                subscriptionStatus: bMerchant.subscription_status,
                pastDueSince: bMerchant.past_due_since,
                gift: bMerchant.birthday_gift_description || (bMerchant.locale === 'en' ? 'a gift' : 'un cadeau'),
                clientName: customer.first_name || '',
              }).catch(() => {});
            }
          } catch {
            results.birthdayVouchers.errors++;
          }
        }

        // Notify merchants about client birthdays (email + push)
        if (birthdayByMerchant.size > 0) {
          // Fetch emails only for birthday merchants (not all merchants)
          const birthdayMerchantUserIds = [...new Set(
            [...birthdayByMerchant.keys()].map(mid => merchantMap.get(mid)?.user_id).filter((uid): uid is string => !!uid)
          )];
          const emailMap = await batchGetUserEmails(supabase, birthdayMerchantUserIds);

          for (const [merchantId, clientNames] of birthdayByMerchant) {
            try {
              const bm = merchantMap.get(merchantId);
              if (!bm) continue;
              const merchantEmail = emailMap.get(bm.user_id);
              if (merchantEmail) {
                const isSubscribed = bm.subscription_status === 'active' || bm.subscription_status === 'canceling';
                await sendBirthdayNotificationEmail(
                  merchantEmail,
                  bm.shop_name,
                  clientNames,
                  bm.birthday_gift_description || 'Cadeau anniversaire',
                  (bm.locale as EmailLocale) || 'fr',
                  isSubscribed
                ).catch(() => {});
                await rateLimitDelay();
              }

              // Push notification to merchant
              const bodyText = clientNames.length === 1
                ? `${clientNames[0]} fête son anniversaire aujourd'hui`
                : `${clientNames.join(', ')} fêtent leur anniversaire aujourd'hui`;
              pushPromises.push(sendMerchantPush({
                supabase,
                merchantId,
                notificationType: 'birthday_digest',
                referenceId: `${merchantId}-${todayParis}`,
                title: `🎂 ${clientNames.length} anniversaire${clientNames.length > 1 ? 's' : ''} aujourd'hui`,
                body: bodyText,
                url: `/dashboard/planning?date=${todayParis}`,
                tag: 'qarte-merchant-birthday',
              }));
            } catch {
              // Never let merchant notification crash the cron
            }
          }
        }
      }
    }

    sectionStatuses.push({ name: 'birthdayVouchers', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'birthdayVouchers', status: 'error', error: String(error) });
  }

  // ==================== DEPOSIT DEADLINE — WARNING ONLY ====================
  // Actual release is handled by the hourly /api/cron/deposit-expiration cron.
  if (isTimedOut()) { sectionStatuses.push({ name: 'depositDeadline', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const nowIso = new Date().toISOString();
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    // Warn merchants about deposits expiring soon (within 4h)
    const { data: expiringSlots } = await supabase
      .from('merchant_planning_slots')
      .select('id, merchant_id, client_name, slot_date, start_time')
      .eq('deposit_confirmed', false)
      .not('deposit_deadline_at', 'is', null)
      .gte('deposit_deadline_at', nowIso)
      .lte('deposit_deadline_at', fourHoursFromNow)
      .is('primary_slot_id', null)
      .limit(200);

    for (const slot of expiringSlots || []) {
      const bm = allMerchantsMap.get(slot.merchant_id);
      if (bm) {
        const isEN = bm.locale === 'en';
        pushPromises.push(sendMerchantPush({
          supabase, merchantId: slot.merchant_id, notificationType: 'deposit_expiring', referenceId: slot.id,
          title: isEN ? 'Deposit expiring soon' : 'Acompte bientôt expiré',
          body: isEN
            ? `${slot.client_name} — confirm or the slot will be released`
            : `${slot.client_name} — confirme ou le créneau sera libéré`,
          url: `/dashboard/planning?date=${slot.slot_date}`, tag: 'qarte-merchant-deposit',
        }));
      }

      results.depositDeadline.warned++;
    }

    sectionStatuses.push({ name: 'depositDeadline', status: 'ok' });
  } catch (error) {
    sectionStatuses.push({ name: 'depositDeadline', status: 'error', error: String(error) });
  }

  // ==================== ATTENDANCE AUTO-MARK ====================
  // Marque en bulk attended tous les slots passés non encore marqués (pending ou NULL).
  // Le merchant peut ensuite flipper en no_show via le soft-prompt dashboard du matin
  // (cf. AttendanceCheckPrompt). Sans ça, chaque RDV demandait un tap manuel.
  if (isTimedOut()) { sectionStatuses.push({ name: 'attendanceAutoMark', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const todayParis = getTodayInParis();
    const { data: marked, error: markErr } = await supabase
      .from('merchant_planning_slots')
      .update({ attendance_status: 'attended' })
      .lt('slot_date', todayParis)
      .or('attendance_status.is.null,attendance_status.eq.pending')
      .not('client_name', 'is', null)
      .neq('client_name', '__blocked__')
      .is('primary_slot_id', null)
      .select('id, merchant_id, customer_id');
    if (markErr) throw markErr;
    results.attendanceAutoMarked.count = marked?.length || 0;

    // Symbiose résa → fidélité : créditer les résas fraîchement passées "Venue", pour les
    // merchants ayant activé l'option. Résas reliées à une cliente uniquement (walk-in ignoré).
    const bookingSlots = (marked || []).filter((s) => s.customer_id);
    if (bookingSlots.length > 0) {
      const merchantIds = [...new Set(bookingSlots.map((s) => s.merchant_id))];
      const { data: optedIn } = await supabase
        .from('merchants')
        .select('id')
        .in('id', merchantIds)
        .eq('booking_earns_loyalty', true);
      const optedInSet = new Set((optedIn || []).map((m) => m.id));
      let credited = 0;
      for (const s of bookingSlots) {
        if (!optedInSet.has(s.merchant_id)) continue;
        try {
          if ((await creditBookingLoyalty(supabase, s.id)) === 'credited') credited++;
        } catch (e) {
          logger.error('morning-jobs booking loyalty credit error', e);
        }
      }
      results.attendanceAutoMarked.creditedLoyalty = credited;
    }
    sectionStatuses.push({ name: 'attendanceAutoMark', status: 'ok' });
  } catch (err) {
    logger.error('attendance auto-mark error:', err);
    sectionStatuses.push({ name: 'attendanceAutoMark', status: 'error', error: err instanceof Error ? err.message : String(err) });
  }

  // ==================== CONTEST PRIZE REMINDER ====================
  // Si contest_enabled = true ET pas de lot pour le mois courant (ni planifié,
  // ni fallback merchants.contest_prize) ET on est dans les 5 derniers jours
  // du mois → push + email pour rappeler de définir le lot avant le tirage du 1er.
  // Idempotent via merchants.contest_missing_prize_alerted_at (max 1 alerte/mois).
  if (isTimedOut()) { sectionStatuses.push({ name: 'contestPrizeReminder', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const todayParis = getTodayInParis();
    const todayDate = new Date(todayParis + 'T12:00:00');
    const currentMonth = todayParis.slice(0, 7);
    const dayOfMonth = todayDate.getDate();
    const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
    const isInLast5Days = (lastDayOfMonth - dayOfMonth) <= 4;

    if (isInLast5Days) {
      const { data: contestMerchants } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id, locale, contest_prize, contest_missing_prize_alerted_at')
        .eq('contest_enabled', true)
        .in('subscription_status', ['active', 'canceling']);

      if (contestMerchants && contestMerchants.length > 0) {
        const ids = contestMerchants.map((m) => m.id);
        const { data: prizes } = await supabase
          .from('merchant_contest_prizes')
          .select('merchant_id')
          .in('merchant_id', ids)
          .eq('contest_month', currentMonth);
        const haveCurrentPrize = new Set((prizes || []).map((p) => p.merchant_id));

        const targets = contestMerchants.filter((m) => {
          if (haveCurrentPrize.has(m.id)) return false;
          if ((m.contest_prize || '').trim().length > 0) return false;
          if (m.contest_missing_prize_alerted_at) {
            const lastAlertMonth = new Date(m.contest_missing_prize_alerted_at).toISOString().slice(0, 7);
            if (lastAlertMonth === currentMonth) return false;
          }
          return true;
        });

        results.contestPrizeReminder.processed = targets.length;

        if (targets.length > 0) {
          const userIds = targets.map((m) => m.user_id).filter((id): id is string => Boolean(id));
          const emailsByUserId = await batchGetUserEmails(supabase, userIds);

          for (const m of targets) {
            const isEN = m.locale === 'en';
            const monthLabel = todayDate.toLocaleDateString(isEN ? 'en-US' : 'fr-FR', { month: 'long' });
            const title = isEN ? 'Pick the contest prize before the draw' : 'Définis le lot du concours avant le tirage';
            const body = isEN
              ? `${m.shop_name} — your monthly draw is in a few days but no prize is set yet.`
              : `${m.shop_name} — le tirage du mois arrive et tu n'as pas encore défini de lot.`;

            pushPromises.push(
              sendMerchantPush({
                supabase,
                merchantId: m.id,
                notificationType: 'contest_missing_prize',
                referenceId: currentMonth,
                title,
                body,
                url: '/dashboard/contest',
                tag: 'qarte-merchant-contest-missing-prize',
              }).catch(() => false),
            );

            const email = m.user_id ? emailsByUserId.get(m.user_id) : null;
            if (email) {
              try {
                await resend?.emails.send({
                  from: EMAIL_FROM,
                  to: email,
                  subject: isEN
                    ? `${m.shop_name} — pick the contest prize for ${monthLabel}`
                    : `${m.shop_name} — définis le lot du concours pour ${monthLabel}`,
                  text: isEN
                    ? `Your monthly draw is in a few days. Set the prize for ${monthLabel} before the draw on the 1st:\nhttps://getqarte.com/dashboard/contest`
                    : `Le tirage du mois est dans quelques jours. Définis le lot pour ${monthLabel} avant le tirage du 1er :\nhttps://getqarte.com/dashboard/contest`,
                  headers: EMAIL_HEADERS,
                });
              } catch (emailErr) {
                logger.error(`Contest reminder email error for ${m.id}:`, emailErr);
              }
            }
            await rateLimitDelay();
          }

          await supabase
            .from('merchants')
            .update({ contest_missing_prize_alerted_at: new Date().toISOString() })
            .in('id', targets.map((m) => m.id));
          results.contestPrizeReminder.alerted = targets.length;
        }
      }
    }
    sectionStatuses.push({ name: 'contestPrizeReminder', status: 'ok' });
  } catch (err) {
    logger.error('contest prize reminder error:', err);
    sectionStatuses.push({ name: 'contestPrizeReminder', status: 'error', error: err instanceof Error ? err.message : String(err) });
  }

  // ==================== PURGE CACHE AVIS GOOGLE (ToS) ====================
  // Le texte des avis Google ne doit pas être stocké au-delà de ~72h. Le cache
  // est rafraîchi à la consultation, mais les salons sans trafic / churned
  // laisseraient des lignes périmées : on les supprime ici.
  try {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: purged } = await supabase
      .from('merchant_google_reviews_cache')
      .delete()
      .lt('fetched_at', cutoff)
      .select('merchant_id');
    results.googleReviewsCachePurge.deleted = purged?.length || 0;
    sectionStatuses.push({ name: 'googleReviewsCachePurge', status: 'ok' });
  } catch (err) {
    sectionStatuses.push({ name: 'googleReviewsCachePurge', status: 'error', error: err instanceof Error ? err.message : String(err) });
  }

  // ==================== RAPPEL ACOMPTE J-7 — RDV DE SUIVI (mig 177) ====================
  // RDV de suivi (+3/+6 sem.) réservés sans acompte : 7 jours avant, on rappelle la
  // cliente (email + SMS) pour régler l'acompte / reporter / annuler, et on pose la
  // deadline (= RDV − cancel_deadline_days). Le cron deposit-expiration libère ensuite.
  if (isTimedOut()) { sectionStatuses.push({ name: 'followupDepositReminders', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const r = await sendFollowupDepositReminders(supabase, { now });
    results.followupDepositReminders = r;
    sectionStatuses.push({ name: 'followupDepositReminders', status: 'ok' });
  } catch (err) {
    sectionStatuses.push({ name: 'followupDepositReminders', status: 'error', error: err instanceof Error ? err.message : String(err) });
  }

  // Await all push promises before returning
  if (pushPromises.length > 0) {
    await Promise.allSettled(pushPromises);
  }

  // ==================== RESPONSE ====================
  const elapsedMs = Date.now() - cronStartTime;
  const failedSections = sectionStatuses.filter(s => s.status === 'error');
  if (failedSections.length > 0) {
    logger.error('Morning-jobs cron — sections failed', failedSections);
  }
  const hasFailures = failedSections.length > 0;
  logger.info('Morning-jobs cron completed', { success: !hasFailures, elapsedMs, ...results, sectionStatuses });
  return NextResponse.json(
    { success: !hasFailures, elapsedMs, ...results, sectionStatuses },
    { status: hasFailures ? 500 : 200 }
  );
}
