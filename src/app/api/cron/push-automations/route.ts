import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Default messages for automations
const AUTOMATION_MESSAGES = {
  inactive_reminder: {
    title: 'On vous attend !',
    body: 'Ça fait un moment... Passez nous voir ! 👋',
  },
  reward_reminder: {
    title: 'Votre cadeau vous attend !',
    body: "N'oubliez pas d'utiliser votre récompense ! 🎁",
  },
};

// POST - Run daily automations (called by Vercel cron)
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();

  // Configure web-push
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }

  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);

  const results = {
    inactive_reminder: { sent: 0, failed: 0 },
    reward_reminder: { sent: 0, failed: 0 },
  };

  try {
    // Get all merchants with automations enabled
    const { data: automations, error: automationsError } = await supabase
      .from('push_automations')
      .select('*, merchants!inner(id, shop_name)')
      .or('inactive_reminder_enabled.eq.true,reward_reminder_enabled.eq.true');

    if (automationsError) {
      console.error('Error fetching automations:', automationsError);
      return NextResponse.json({ error: 'Error fetching automations' }, { status: 500 });
    }

    if (!automations || automations.length === 0) {
      return NextResponse.json({ message: 'No automations enabled', results });
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const automation of automations) {
      const merchantId = automation.merchant_id;
      const shopName = (automation.merchants as any)?.shop_name || 'Votre commerce';

      // Get all loyalty cards for this merchant with customer and subscription info
      const { data: cards, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          customers!inner(id, push_subscriptions(id, endpoint, p256dh, auth))
        `)
        .eq('merchant_id', merchantId);

      if (cardsError || !cards) {
        console.error('Error fetching cards for merchant:', merchantId, cardsError);
        continue;
      }

      // Process each card
      for (const card of cards) {
        const customer = card.customers as any;
        const subscriptions = customer?.push_subscriptions || [];

        if (subscriptions.length === 0) continue;

        // INACTIVE REMINDER: No visit in 30 days
        if (automation.inactive_reminder_enabled) {
          // Check last visit
          const { data: lastVisit } = await supabase
            .from('visits')
            .select('visited_at')
            .eq('loyalty_card_id', card.id)
            .eq('status', 'confirmed')
            .order('visited_at', { ascending: false })
            .limit(1)
            .single();

          const isInactive = !lastVisit || new Date(lastVisit.visited_at) < new Date(thirtyDaysAgo);

          if (isInactive) {
            // Check if we already sent today
            const { data: existingLog } = await supabase
              .from('push_automation_logs')
              .select('id')
              .eq('merchant_id', merchantId)
              .eq('customer_id', card.customer_id)
              .eq('automation_type', 'inactive_reminder')
              .gte('sent_at', today)
              .single();

            if (!existingLog) {
              // Send notification
              const sent = await sendPushToSubscriptions(
                subscriptions,
                {
                  title: shopName,
                  body: AUTOMATION_MESSAGES.inactive_reminder.body,
                  url: `/customer/card/${merchantId}`,
                },
                supabase
              );

              if (sent > 0) {
                // Log the send
                await supabase.from('push_automation_logs').insert({
                  merchant_id: merchantId,
                  customer_id: card.customer_id,
                  automation_type: 'inactive_reminder',
                });

                // Update counter
                await supabase
                  .from('push_automations')
                  .update({ inactive_reminder_sent: automation.inactive_reminder_sent + 1 })
                  .eq('merchant_id', merchantId);

                results.inactive_reminder.sent += sent;
              } else {
                results.inactive_reminder.failed++;
              }
            }
          }
        }

        // REWARD REMINDER: Has reward ready for 7+ days
        if (automation.reward_reminder_enabled) {
          // Get stamps_required from merchant
          const { data: merchant } = await supabase
            .from('merchants')
            .select('stamps_required')
            .eq('id', merchantId)
            .single();

          const stampsRequired = merchant?.stamps_required || 10;

          if (card.current_stamps >= stampsRequired) {
            // Check when they reached the goal (last visit that put them at/over goal)
            const { data: rewardVisit } = await supabase
              .from('visits')
              .select('visited_at')
              .eq('loyalty_card_id', card.id)
              .eq('status', 'confirmed')
              .order('visited_at', { ascending: false })
              .limit(1)
              .single();

            const rewardReadySince = rewardVisit?.visited_at;
            const isOldReward = rewardReadySince && new Date(rewardReadySince) < new Date(sevenDaysAgo);

            if (isOldReward) {
              // Check if we already sent this week
              const { data: existingLog } = await supabase
                .from('push_automation_logs')
                .select('id')
                .eq('merchant_id', merchantId)
                .eq('customer_id', card.customer_id)
                .eq('automation_type', 'reward_reminder')
                .gte('sent_at', sevenDaysAgo)
                .single();

              if (!existingLog) {
                const sent = await sendPushToSubscriptions(
                  subscriptions,
                  {
                    title: shopName,
                    body: AUTOMATION_MESSAGES.reward_reminder.body,
                    url: `/customer/card/${merchantId}`,
                  },
                  supabase
                );

                if (sent > 0) {
                  await supabase.from('push_automation_logs').insert({
                    merchant_id: merchantId,
                    customer_id: card.customer_id,
                    automation_type: 'reward_reminder',
                  });

                  await supabase
                    .from('push_automations')
                    .update({ reward_reminder_sent: automation.reward_reminder_sent + 1 })
                    .eq('merchant_id', merchantId);

                  results.reward_reminder.sent += sent;
                } else {
                  results.reward_reminder.failed++;
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron automation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Helper to send push to subscriptions
async function sendPushToSubscriptions(
  subscriptions: any[],
  payload: { title: string; body: string; url: string },
  supabase: any
): Promise<number> {
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: '/icon-192.png',
          url: payload.url,
          tag: 'qarte-automation',
        })
      );
      sent++;
    } catch (err: any) {
      console.error('Push send error:', err.statusCode, err.message);
      // Remove invalid subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return sent;
}

// GET for testing/manual trigger
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reuse POST logic
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  return POST(fakeRequest);
}
