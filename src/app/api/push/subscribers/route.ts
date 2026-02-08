import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';

interface SubscriberCustomer {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string | null;
}

// Helper to verify merchant ownership
async function verifyMerchantOwnership(merchantId: string): Promise<{ authorized: boolean }> {
  const supabaseAuth = await createRouteHandlerSupabaseClient();
  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return { authorized: false };
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return { authorized: false };
  }

  return { authorized: true };
}

// GET - Get subscriber count for a merchant
// Note: A customer is considered a "subscriber" if they have push enabled
// The push subscription might be linked to a customer_id from ANY merchant
// (same phone number = same person, so they can receive push from all merchants)
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId requis' },
        { status: 400 }
      );
    }

    // SECURITY: Verify user owns this merchant
    const authCheck = await verifyMerchantOwnership(merchantId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Step 1: Get all customers with loyalty cards for this merchant (with their phone numbers)
    // Limit to 5000 to prevent memory spikes
    const { data: merchantCustomers, error: cardsError } = await supabase
      .from('loyalty_cards')
      .select('customer_id, customers!inner(id, phone_number, first_name, last_name)')
      .eq('merchant_id', merchantId)
      .limit(5000);

    if (cardsError) {
      console.error('Error fetching loyalty cards:', cardsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des clients' },
        { status: 500 }
      );
    }

    if (!merchantCustomers || merchantCustomers.length === 0) {
      return NextResponse.json({ count: 0, subscriberIds: [], subscribers: [] });
    }

    // Build a map of phone -> this merchant's customer data
    const phoneToMerchantCustomer = new Map<string, SubscriberCustomer>();
    for (const card of merchantCustomers) {
      // Supabase returns customers as object (not array) with !inner join
      const customer = card.customers as unknown as SubscriberCustomer;
      if (customer?.phone_number) {
        phoneToMerchantCustomer.set(customer.phone_number, {
          id: customer.id,
          phone_number: customer.phone_number,
          first_name: customer.first_name,
          last_name: customer.last_name,
        });
      }
    }

    const phoneNumbers = [...phoneToMerchantCustomer.keys()];

    if (phoneNumbers.length === 0) {
      return NextResponse.json({ count: 0, subscriberIds: [], subscribers: [] });
    }

    // Step 2: Find ALL customer IDs (from any merchant) that have these phone numbers
    const { data: allCustomersWithPhone, error: phoneError } = await supabase
      .from('customers')
      .select('id, phone_number')
      .in('phone_number', phoneNumbers)
      .limit(10000);

    if (phoneError) {
      console.error('Error fetching customers by phone:', phoneError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des clients' },
        { status: 500 }
      );
    }

    // Build a map of customer_id -> phone_number (for all merchants)
    const customerIdToPhone = new Map<string, string>();
    for (const c of allCustomersWithPhone || []) {
      customerIdToPhone.set(c.id, c.phone_number);
    }

    const allCustomerIds = [...customerIdToPhone.keys()];

    if (allCustomerIds.length === 0) {
      return NextResponse.json({ count: 0, subscriberIds: [], subscribers: [] });
    }

    // Step 3: Get push subscriptions for ANY of these customer IDs
    // Use inner join to ensure the customer still exists (filter orphaned subscriptions)
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('customer_id, customers!inner(id)')
      .in('customer_id', allCustomerIds)
      .limit(10000);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des abonnés' },
        { status: 500 }
      );
    }

    // Step 4: Find which phone numbers have push subscriptions
    const phonesWithPush = new Set<string>();
    for (const sub of subscriptions || []) {
      const phone = customerIdToPhone.get(sub.customer_id);
      if (phone) {
        phonesWithPush.add(phone);
      }
    }

    // Step 5: Get THIS merchant's customer IDs for phones with push
    const subscriberCustomerIds: string[] = [];
    const subscribersData: SubscriberCustomer[] = [];

    for (const phone of phonesWithPush) {
      const merchantCustomer = phoneToMerchantCustomer.get(phone);
      if (merchantCustomer) {
        subscriberCustomerIds.push(merchantCustomer.id);
        subscribersData.push(merchantCustomer);
      }
    }

    // Check if we need full subscriber info
    const includeDetails = searchParams.get('details') === 'true';

    if (includeDetails && subscriberCustomerIds.length > 0) {
      // Fetch loyalty cards with visits for marketing filters
      const { data: loyaltyCardsWithDetails, error: cardsDetailError } = await supabase
        .from('loyalty_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          created_at
        `)
        .eq('merchant_id', merchantId)
        .in('customer_id', subscriberCustomerIds);

      if (cardsDetailError) {
        console.error('Error fetching loyalty card details:', cardsDetailError);
      }

      // Get merchant stamps_required
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('stamps_required')
        .eq('id', merchantId)
        .single();

      // Get last visit dates for each card
      const cardIds = (loyaltyCardsWithDetails || []).map(c => c.id);
      let visitData: { loyalty_card_id: string; visited_at: string }[] = [];

      if (cardIds.length > 0) {
        const { data: visits } = await supabase
          .from('visits')
          .select('loyalty_card_id, visited_at')
          .in('loyalty_card_id', cardIds)
          .eq('status', 'confirmed')
          .order('visited_at', { ascending: false });

        visitData = visits || [];
      }

      // Group visits by card_id and get the latest
      const lastVisitByCard = new Map<string, string>();
      for (const visit of visitData) {
        if (!lastVisitByCard.has(visit.loyalty_card_id)) {
          lastVisitByCard.set(visit.loyalty_card_id, visit.visited_at);
        }
      }

      // Count visits per card
      const visitCountByCard = new Map<string, number>();
      for (const visit of visitData) {
        visitCountByCard.set(
          visit.loyalty_card_id,
          (visitCountByCard.get(visit.loyalty_card_id) || 0) + 1
        );
      }

      // Merge customer info with loyalty card data
      const subscribersWithDetails = subscribersData.map(customer => {
        const card = (loyaltyCardsWithDetails || []).find(c => c.customer_id === customer.id);
        return {
          ...customer,
          loyalty_card_id: card?.id || null,
          current_stamps: card?.current_stamps || 0,
          stamps_required: merchantData?.stamps_required || 10,
          last_visit: card ? lastVisitByCard.get(card.id) || null : null,
          total_visits: card ? visitCountByCard.get(card.id) || 0 : 0,
          card_created_at: card?.created_at || null,
        };
      });

      return NextResponse.json({
        count: subscriberCustomerIds.length,
        subscriberIds: subscriberCustomerIds,
        subscribers: subscribersWithDetails
      });
    }

    return NextResponse.json({
      count: subscriberCustomerIds.length,
      subscriberIds: subscriberCustomerIds
    });
  } catch (error) {
    console.error('Subscribers count error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
