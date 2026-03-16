import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { getTodayInParis } from '@/lib/utils';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || !authHeader?.startsWith('Bearer ') ||
      !timingSafeCompare(authHeader.slice(7), CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    sent: 0,
    errors: 0,
  };

  try {
    const today = getTodayInParis();

    const { data: scheduledPushes } = await supabase
      .from('scheduled_push')
      .select('*')
      .eq('scheduled_date', today)
      .eq('scheduled_time', '18:00')
      .eq('status', 'pending');

    // Batch fetch all merchants, loyalty cards, and push subscriptions upfront (avoid N+1)
    const pushMerchantIds = [...new Set((scheduledPushes || []).map(p => p.merchant_id))];
    const [{ data: allMerchants }, { data: allCards }, { data: allSubs }] = await Promise.all([
      supabase.from('merchants').select('id, shop_name').in('id', pushMerchantIds),
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
            filter_type: 'scheduled_18h',
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

    logger.info('Evening cron completed', results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    logger.error('Evening cron error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
