import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:contact@qarte.fr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { merchantId, customerId, payload } = await request.json() as {
      merchantId?: string;
      customerId?: string;
      payload: PushPayload;
    };

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Payload invalide (title et body requis)' },
        { status: 400 }
      );
    }

    // Build query to get subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des abonnements' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'Aucun abonné trouvé',
      });
    }

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/icon-192.svg',
              url: payload.url || '/',
              tag: payload.tag || 'qarte-notification',
            })
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (err: any) {
          // If subscription is expired/invalid, delete it
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { success: false, endpoint: sub.endpoint, error: err.message };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Send push error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
