import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase client at runtime
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { subscription, customerId } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Subscription invalide' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID requis' },
        { status: 400 }
      );
    }

    // SECURITY: Validate that customerId exists in the database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      );
    }

    // Extract keys from subscription
    const keys = subscription.keys || {};

    // Upsert subscription (update if endpoint exists, insert if not)
    // Note: subscription is linked to CUSTOMER only, not merchant
    // This allows customers with multiple cards to receive notifications from ALL their merchants
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          customer_id: customerId,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh || '',
          auth: keys.auth || '',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: data,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe
export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requis' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
