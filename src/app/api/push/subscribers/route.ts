import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase client with service role (bypasses RLS)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - Get subscriber count for a merchant
export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId requis' },
        { status: 400 }
      );
    }

    // Get all customer IDs with loyalty cards for this merchant
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

    if (!loyaltyCards || loyaltyCards.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // Get unique customer IDs
    const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];

    // Get push subscriptions for these customers
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('customer_id')
      .in('customer_id', customerIds);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des abonnés' },
        { status: 500 }
      );
    }

    // Get unique subscriber customer IDs
    const subscriberIds = [...new Set((subscriptions || []).map(s => s.customer_id))];

    // Check if we need full subscriber info
    const includeDetails = searchParams.get('details') === 'true';

    if (includeDetails && subscriberIds.length > 0) {
      // Fetch customer details for subscribers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone_number')
        .in('id', subscriberIds);

      if (customersError) {
        console.error('Error fetching customer details:', customersError);
      }

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
        .in('customer_id', subscriberIds);

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
      const subscribersWithDetails = (customers || []).map(customer => {
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
        count: subscriberIds.length,
        subscriberIds,
        subscribers: subscribersWithDetails
      });
    }

    return NextResponse.json({
      count: subscriberIds.length,
      subscriberIds
    });
  } catch (error) {
    console.error('Subscribers count error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
