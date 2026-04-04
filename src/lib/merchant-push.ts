import { SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);
}

/**
 * Send a push notification to a merchant's subscribed devices.
 * Fire-and-forget — never throws, returns true if at least one push was sent.
 */
export async function sendMerchantPush(params: {
  supabase: SupabaseClient;
  merchantId: string;
  notificationType: string;
  referenceId?: string;
  title: string;
  body: string;
  url: string;
  tag?: string;
}): Promise<boolean> {
  const { supabase, merchantId, notificationType, referenceId, title, body, url, tag } = params;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('[merchant-push] VAPID keys missing');
    return false;
  }

  try {
    // 1. Dedup by reference_id (e.g. same booking slot)
    if (referenceId) {
      const { data: existing } = await supabase
        .from('merchant_push_logs')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('notification_type', notificationType)
        .eq('reference_id', referenceId)
        .limit(1)
        .maybeSingle();

      if (existing) return false;
    }

    // 2. Fetch merchant push subscriptions
    const { data: subscriptions } = await supabase
      .from('merchant_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('merchant_id', merchantId);

    if (!subscriptions || subscriptions.length === 0) {
      console.warn(`[merchant-push] No subscriptions for merchant ${merchantId}`);
      return false;
    }

    // 3. Send via webpush
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-pro-192.png',
      url,
      tag: tag || `qarte-merchant-${notificationType}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    );

    // 4. Cleanup expired endpoints (404/410)
    const failedEndpoints: string[] = [];
    let sentCount = 0;
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        sentCount++;
      } else {
        const err = result.reason as { statusCode?: number };
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          failedEndpoints.push(subscriptions[idx].endpoint);
        }
      }
    });

    if (failedEndpoints.length > 0) {
      await supabase.from('merchant_push_subscriptions').delete().in('endpoint', failedEndpoints);
    }

    if (sentCount === 0) return false;

    // 5. Log for dedup
    await supabase.from('merchant_push_logs').insert({
      merchant_id: merchantId,
      notification_type: notificationType,
      reference_id: referenceId || null,
    });

    return true;
  } catch (err) {
    console.error(`[merchant-push] Error sending to merchant ${merchantId}:`, err);
    return false;
  }
}
