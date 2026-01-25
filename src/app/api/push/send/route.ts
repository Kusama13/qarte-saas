import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys missing:', { publicKey: !!vapidPublicKey, privateKey: !!vapidPrivateKey });
      return NextResponse.json(
        { error: 'Configuration VAPID manquante' },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase config missing');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    // Initialize Supabase client at runtime
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Configure web-push with VAPID keys at runtime
    webpush.setVapidDetails(
      'mailto:contact@qarte.fr',
      vapidPublicKey,
      vapidPrivateKey
    );

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

    let subscriptions: any[] = [];

    if (customerId) {
      // Send to specific customer
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des abonnements' },
          { status: 500 }
        );
      }
      subscriptions = data || [];
    } else if (merchantId) {
      // Send to all customers who have a loyalty card with this merchant
      // First, get all customer IDs with loyalty cards for this merchant
      const { data: loyaltyCards, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select('customer_id')
        .eq('merchant_id', merchantId);

      if (cardsError) {
        console.error('Error fetching loyalty cards:', cardsError);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des clients' },
          { status: 500 }
        );
      }

      if (loyaltyCards && loyaltyCards.length > 0) {
        const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];

        // Get push subscriptions for these customers
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('customer_id', customerIds);

        if (error) {
          console.error('Error fetching subscriptions:', error);
          return NextResponse.json(
            { error: 'Erreur lors de la récupération des abonnements' },
            { status: 500 }
          );
        }
        subscriptions = data || [];
      }
    } else {
      return NextResponse.json(
        { error: 'merchantId ou customerId requis' },
        { status: 400 }
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
