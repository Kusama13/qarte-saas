import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - Get pending scheduled message for merchant
export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const { data: scheduled, error } = await supabase
      .from('scheduled_push')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching scheduled:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ scheduled: scheduled || null });
  } catch (error) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Create scheduled message
export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { merchantId, title, body: messageBody, filterType, customerIds, scheduledFor } = body;

    if (!merchantId || !title || !messageBody || !scheduledFor) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 });
    }

    // Check if there's already a pending message
    const { data: existing } = await supabase
      .from('scheduled_push')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Un message est déjà programmé. Annulez-le d\'abord.' },
        { status: 400 }
      );
    }

    const { data: scheduled, error } = await supabase
      .from('scheduled_push')
      .insert({
        merchant_id: merchantId,
        title,
        body: messageBody,
        filter_type: filterType || 'all',
        customer_ids: customerIds || null,
        scheduled_for: scheduledFor,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scheduled:', error);
      return NextResponse.json({ error: 'Erreur lors de la programmation' }, { status: 500 });
    }

    return NextResponse.json({ scheduled });
  } catch (error) {
    console.error('Schedule create error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Cancel scheduled message
export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const scheduleId = searchParams.get('id');

    if (!merchantId || !scheduleId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scheduled_push')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', scheduleId)
      .eq('merchant_id', merchantId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling scheduled:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedule cancel error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
