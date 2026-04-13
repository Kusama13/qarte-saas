export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getTodayInParis, getTodayForCountry } from '@/lib/utils';
import { sendBirthdayNotificationEmail, sendSlotReleasedEmail } from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import { sendMerchantPush } from '@/lib/merchant-push';
import { sendBookingSms } from '@/lib/sms';
import { resend, EMAIL_FROM, EMAIL_HEADERS } from '@/lib/resend';
import { verifyCronAuth, batchGetUserEmails, rateLimitDelay } from '@/lib/cron-helpers';
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
  };

  const sectionStatuses: Array<{ name: string; status: 'ok' | 'error'; error?: string }> = [];
  const pushPromises: Promise<boolean>[] = [];
  const now = new Date();

  // ==================== PREFETCH ====================
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, country, subscription_status, no_contact, birthday_gift_enabled, birthday_gift_description, pwa_installed_at, email_bounced_at, email_unsubscribed_at');

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

            // SMS birthday to customer
            if (customer.phone_number) {
              sendBookingSms(supabase, {
                merchantId: customer.merchant_id,
                phone: customer.phone_number,
                shopName: bMerchant.shop_name,
                smsType: 'birthday',
                locale: bMerchant.locale || 'fr',
                subscriptionStatus: bMerchant.subscription_status,
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

  // ==================== DEPOSIT DEADLINE CHECK ====================
  if (isTimedOut()) { sectionStatuses.push({ name: 'depositDeadline', status: 'error', error: 'Skipped: cron timeout' }); }
  else try {
    const nowIso = new Date().toISOString();
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    // 14A. Auto-release expired deposits
    const { data: expiredSlots } = await supabase
      .from('merchant_planning_slots')
      .select('id, merchant_id, client_name, slot_date, start_time, primary_slot_id')
      .eq('deposit_confirmed', false)
      .not('deposit_deadline_at', 'is', null)
      .lt('deposit_deadline_at', nowIso)
      .is('primary_slot_id', null)
      .limit(200);

    for (const slot of expiredSlots || []) {
      const { data: fillerSlots } = await supabase
        .from('merchant_planning_slots')
        .select('id')
        .eq('primary_slot_id', slot.id);

      const allSlotIds = [slot.id, ...(fillerSlots || []).map(f => f.id)];

      await supabase.from('planning_slot_services').delete().in('slot_id', allSlotIds);

      if (fillerSlots && fillerSlots.length > 0) {
        await supabase
          .from('merchant_planning_slots')
          .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null, deposit_deadline_at: null, primary_slot_id: null })
          .in('id', fillerSlots.map(f => f.id));
      }

      await supabase
        .from('merchant_planning_slots')
        .update({ client_name: null, client_phone: null, customer_id: null, deposit_confirmed: null, deposit_deadline_at: null })
        .eq('id', slot.id);

      const bm = allMerchantsMap.get(slot.merchant_id);
      if (bm) {
        const isEN = bm.locale === 'en';
        pushPromises.push(sendMerchantPush({
          supabase, merchantId: slot.merchant_id, notificationType: 'deposit_expired', referenceId: slot.id,
          title: isEN ? 'Slot released — deposit not received' : 'Créneau libéré — acompte non reçu',
          body: isEN
            ? `${slot.client_name} — ${slot.slot_date} at ${slot.start_time}`
            : `${slot.client_name} — ${slot.slot_date} à ${slot.start_time}`,
          url: `/dashboard/planning?date=${slot.slot_date}`, tag: 'qarte-merchant-deposit',
        }));

        // Email notification
        (async () => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(bm.user_id);
            if (authUser?.user?.email) {
              sendSlotReleasedEmail(authUser.user.email, {
                shopName: bm.shop_name,
                clientName: slot.client_name,
                date: slot.slot_date,
                time: slot.start_time,
                locale: (bm.locale || 'fr') as 'fr' | 'en',
              }).catch(() => {});
            }
          } catch { /* silent */ }
        })();
      }

      results.depositDeadline.released++;
    }

    // 14B. Warn merchants about deposits expiring soon (within 4h)
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
