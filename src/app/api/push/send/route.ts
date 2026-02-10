import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import webpush from 'web-push';

interface PushSubscriptionRecord {
  id: string;
  customer_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

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

    // Initialize Supabase clients
    const supabase = createClient(supabaseUrl, supabaseKey);
    const supabaseAuth = await createRouteHandlerSupabaseClient();

    // Configure web-push with VAPID keys at runtime
    webpush.setVapidDetails(
      'mailto:contact@qarte.fr',
      vapidPublicKey,
      vapidPrivateKey
    );

    const { merchantId, customerId, customerIds, filterType, payload } = await request.json() as {
      merchantId?: string;
      customerId?: string;
      customerIds?: string[]; // Optional: filter to specific customer IDs
      filterType?: string; // Optional: filter type for history tracking
      payload: PushPayload;
    };

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Payload invalide (title et body requis)' },
        { status: 400 }
      );
    }

    // SECURITY: Verify merchant ownership if sending to merchant's customers
    if (merchantId) {
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Non autorisé - connexion requise' },
          { status: 401 }
        );
      }

      // Verify the user owns this merchant
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', merchantId)
        .eq('user_id', user.id)
        .single();

      if (merchantError || !merchant) {
        return NextResponse.json(
          { error: 'Non autorisé - vous ne pouvez pas envoyer de notifications pour ce commerce' },
          { status: 403 }
        );
      }
    }

    let subscriptions: PushSubscriptionRecord[] = [];
    // Map customer_id -> phone_number for deduplication (unique customers notified)
    const customerIdToPhone = new Map<string, string>();

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
      // Note: Push subscriptions might be linked to customer_id from ANY merchant
      // So we need to find all customers by phone number

      // Step 1: Get all customers with loyalty cards for this merchant (with phone numbers)
      const { data: merchantCustomers, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select('customer_id, customers!inner(id, phone_number)')
        .eq('merchant_id', merchantId);

      if (cardsError) {
        console.error('Error fetching loyalty cards:', cardsError);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des clients' },
          { status: 500 }
        );
      }

      if (merchantCustomers && merchantCustomers.length > 0) {
        // Build phone -> merchant customer_id map
        const phoneToMerchantCustomerId = new Map<string, string>();
        for (const card of merchantCustomers) {
          // Supabase returns customers as object (not array) with !inner join
          const customer = card.customers as unknown as { id: string; phone_number: string };
          if (customer?.phone_number) {
            phoneToMerchantCustomerId.set(customer.phone_number, card.customer_id);
          }
        }

        let targetPhones = [...phoneToMerchantCustomerId.keys()];

        // If customerIds filter is provided, only send to those customers
        if (customerIds && customerIds.length > 0) {
          targetPhones = targetPhones.filter(phone =>
            customerIds.includes(phoneToMerchantCustomerId.get(phone)!)
          );
        }

        if (targetPhones.length === 0) {
          return NextResponse.json({
            success: true,
            sent: 0,
            message: 'Aucun client correspondant aux critères',
          });
        }

        // Step 2: Find ALL customer IDs (from any merchant) with these phone numbers
        const { data: allCustomersWithPhone, error: phoneError } = await supabase
          .from('customers')
          .select('id, phone_number')
          .in('phone_number', targetPhones);

        if (phoneError) {
          console.error('Error fetching customers by phone:', phoneError);
          return NextResponse.json(
            { error: 'Erreur lors de la récupération des clients' },
            { status: 500 }
          );
        }

        // Build customer_id -> phone map for deduplication after send
        for (const c of allCustomersWithPhone || []) {
          customerIdToPhone.set(c.id, c.phone_number);
        }

        const allCustomerIds = (allCustomersWithPhone || []).map(c => c.id);

        if (allCustomerIds.length === 0) {
          return NextResponse.json({
            success: true,
            sent: 0,
            message: 'Aucun client trouvé',
          });
        }

        // Step 3: Get push subscriptions for ANY of these customer IDs
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('customer_id', allCustomerIds);

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
              icon: payload.icon || '/icon-192.png',
              url: payload.url || '/customer/cards',
              tag: payload.tag || 'qarte-notification',
            })
          );
          return { success: true, endpoint: sub.endpoint, customerId: sub.customer_id };
        } catch (err) {
          const webPushError = err as { statusCode?: number; message?: string; body?: string };
          console.error('Push send error for endpoint:', sub.endpoint?.substring(0, 50));
          console.error('Error details:', webPushError.statusCode, webPushError.message, webPushError.body);
          // If subscription is expired/invalid, delete it
          if (webPushError.statusCode === 404 || webPushError.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
          return { success: false, endpoint: sub.endpoint, customerId: sub.customer_id, error: webPushError.message };
        }
      })
    );

    const successfulResults = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    );
    const successfulEndpoints = successfulResults.length;
    const failedEndpoints = results.length - successfulEndpoints;

    // Count unique customers notified (deduplicate by phone number)
    // A customer with 2 devices = 1 person notified, not 2
    let uniqueCustomersNotified = successfulEndpoints;
    if (merchantId && customerIdToPhone.size > 0) {
      const notifiedPhones = new Set<string>();
      for (const r of successfulResults) {
        if (r.status === 'fulfilled') {
          const phone = customerIdToPhone.get(r.value.customerId);
          if (phone) notifiedPhones.add(phone);
        }
      }
      uniqueCustomersNotified = notifiedPhones.size;
    }

    // Save to push history (only for merchant sends, not individual customer sends)
    if (merchantId && successfulEndpoints > 0) {
      try {
        await supabase.from('push_history').insert({
          merchant_id: merchantId,
          title: payload.title,
          body: payload.body,
          filter_type: filterType || 'all',
          sent_count: uniqueCustomersNotified,
          failed_count: failedEndpoints,
        });
      } catch (historyError) {
        console.error('Error saving push history:', historyError);
        // Don't fail the request if history save fails
      }
    }

    return NextResponse.json({
      success: true,
      sent: uniqueCustomersNotified,
      failed: failedEndpoints,
      total: subscriptions.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Send push error:', error);
    console.error('Error stack:', err?.stack);
    console.error('Error message:', err?.message);
    return NextResponse.json(
      { error: 'Erreur serveur', details: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
