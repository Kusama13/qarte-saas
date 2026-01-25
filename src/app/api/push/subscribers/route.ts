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

    // Count push subscriptions for these customers
    const { count, error } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds);

    if (error) {
      console.error('Error counting subscriptions:', error);
      return NextResponse.json(
        { error: 'Erreur lors du comptage des abonnés' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Subscribers count error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
