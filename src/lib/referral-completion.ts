import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendBookingSms } from '@/lib/sms';
import logger from '@/lib/logger';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@getqarte.com', vapidPublicKey, vapidPrivateKey);
}

/**
 * Quand un voucher filleul (`source='referral'`) est marqué utilisé, on doit :
 *   1. Créer le voucher parrain (récompense merchant.referral_reward_referrer, exp 30j)
 *   2. Update referrals.status = 'completed' + referrer_voucher_id
 *   3. Push notif cross-merchant au parrain (s'il a un device souscrit)
 *   4. SMS au parrain (si opt-in + non opt-out + referral_reward_sms_enabled)
 *
 * Appelé depuis :
 *   - `/api/vouchers/use` (scan client classique)
 *   - `/api/referrals/[id]/validate` (validation manuelle merchant)
 *
 * Idempotent : skip si referral déjà completed (filtre `status='pending'`).
 *
 * @param filleulFirstName Optionnel — utilisé dans le push parrain "X a utilisé sa récompense !".
 *                         Si null, fallback "Votre filleul·e".
 * @returns true si le referral existait + a été completed, false sinon (pas un voucher referral).
 */
export async function completeReferralAfterReferredUse(
  supabase: SupabaseClient,
  referredVoucherId: string,
  filleulFirstName: string | null,
): Promise<boolean> {
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_voucher_id', referredVoucherId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!referral) return false;

  const { data: merchant } = await supabase
    .from('merchants')
    .select('referral_reward_referrer, shop_name, locale, subscription_status, referral_reward_sms_enabled')
    .eq('id', referral.merchant_id)
    .single();

  if (!merchant?.referral_reward_referrer) return true;

  const { data: referrerVoucher } = await supabase
    .from('vouchers')
    .insert({
      loyalty_card_id: referral.referrer_card_id,
      merchant_id: referral.merchant_id,
      customer_id: referral.referrer_customer_id,
      reward_description: merchant.referral_reward_referrer,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (!referrerVoucher) return true;

  await supabase
    .from('referrals')
    .update({
      referrer_voucher_id: referrerVoucher.id,
      status: 'completed',
    })
    .eq('id', referral.id);

  // Phone partagé entre push + sms (évite 2 fetches identiques côte à côte).
  const { data: referrerCustomer } = await supabase
    .from('customers')
    .select('phone_number')
    .eq('id', referral.referrer_customer_id)
    .single();

  const referrerPhone = referrerCustomer?.phone_number || null;

  if (vapidPublicKey && vapidPrivateKey && referrerPhone) {
    const sendPushToParrain = async () => {
      try {
        const { data: allReferrerCustomers } = await supabase
          .from('customers')
          .select('id')
          .eq('phone_number', referrerPhone);

        const referrerIds = (allReferrerCustomers || []).map((c) => c.id);
        if (referrerIds.length === 0) return;

        const { data: pushSubs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .in('customer_id', referrerIds);

        if (!pushSubs || pushSubs.length === 0) return;

        const filleulName = filleulFirstName || 'Votre filleul·e';
        const shopName = merchant.shop_name || 'Qarte';

        await Promise.allSettled(
          pushSubs.map(async (sub) => {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify({
                  title: shopName,
                  body: `${filleulName} a utilisé sa récompense ! Votre cadeau vous attend 🎁`,
                  icon: '/icon-192.png',
                  url: `/customer/card/${referral.merchant_id}`,
                  tag: 'qarte-referral-reward',
                })
              );
            } catch (pushErr: unknown) {
              const webPushError = pushErr as { statusCode?: number };
              if (webPushError?.statusCode === 404 || webPushError?.statusCode === 410) {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('endpoint', sub.endpoint);
              }
            }
          })
        );
      } catch (pushError) {
        logger.error('Push notification to referrer failed:', pushError);
      }
    };
    sendPushToParrain().catch(() => {});
  }

  if (merchant.referral_reward_sms_enabled !== false && referrerPhone) {
    const sendSmsToParrain = async () => {
      try {
        const { data: optOut } = await supabase
          .from('sms_opt_outs')
          .select('phone_number')
          .eq('merchant_id', referral.merchant_id)
          .eq('phone_number', referrerPhone)
          .maybeSingle();

        if (optOut) return;

        await sendBookingSms(supabase, {
          merchantId: referral.merchant_id,
          phone: referrerPhone,
          shopName: merchant.shop_name,
          smsType: 'referral_reward',
          locale: (merchant.locale as 'fr' | 'en') || 'fr',
          subscriptionStatus: merchant.subscription_status,
          reward: merchant.referral_reward_referrer || '',
        });
      } catch (smsErr) {
        logger.error('SMS notification to referrer failed:', smsErr);
      }
    };
    sendSmsToParrain().catch(() => {});
  }

  return true;
}
