import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST - Run every 5 minutes to check for scheduled messages
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

  try {
    // Find all pending messages that should be sent now
    const now = new Date().toISOString();

    const { data: scheduledMessages, error: fetchError } = await supabase
      .from('scheduled_push')
      .select('*, merchants!inner(id, shop_name)')
      .eq('status', 'pending')
      .lte('scheduled_for', now);

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError);
      return NextResponse.json({ error: 'Error fetching scheduled' }, { status: 500 });
    }

    if (!scheduledMessages || scheduledMessages.length === 0) {
      return NextResponse.json({ message: 'No scheduled messages to send', sent: 0 });
    }

    const results = [];

    for (const scheduled of scheduledMessages) {
      const merchantId = scheduled.merchant_id;
      const shopName = (scheduled.merchants as any)?.shop_name || 'Votre commerce';

      // Get subscribers based on filter
      let query = supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth, customer_id');

      // If specific customer IDs provided
      if (scheduled.customer_ids && scheduled.customer_ids.length > 0) {
        query = query.in('customer_id', scheduled.customer_ids);
      } else {
        // Get all customers for this merchant
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .eq('merchant_id', merchantId);

        if (customers && customers.length > 0) {
          query = query.in('customer_id', customers.map(c => c.id));
        }
      }

      const { data: subscriptions, error: subError } = await query;

      if (subError || !subscriptions) {
        console.error('Error fetching subscriptions for scheduled:', scheduled.id);
        continue;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: shopName,
              body: `${scheduled.title}: ${scheduled.body}`,
              icon: '/icon-192.png',
              url: `/customer/card/${merchantId}`,
              tag: 'qarte-scheduled',
            })
          );
          sentCount++;
        } catch (err: any) {
          console.error('Scheduled push error:', err.statusCode, err.message);
          failedCount++;
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }

      // Update scheduled message status
      await supabase
        .from('scheduled_push')
        .update({
          status: 'sent',
          sent_count: sentCount,
          failed_count: failedCount,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduled.id);

      // Also log in push_history
      await supabase.from('push_history').insert({
        merchant_id: merchantId,
        title: scheduled.title,
        body: scheduled.body,
        filter_type: scheduled.filter_type,
        sent_count: sentCount,
        failed_count: failedCount,
      });

      results.push({
        id: scheduled.id,
        sent: sentCount,
        failed: failedCount,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Scheduled push cron error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET for testing/manual trigger
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  return POST(fakeRequest);
}
