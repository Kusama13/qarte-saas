import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Récupérer les détails d'une carte de fidélité d'un client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const merchantId = searchParams.get('merchant_id');

    if (!phone || !merchantId) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et merchant_id requis' },
        { status: 400 }
      );
    }

    // Récupérer le client pour ce commerçant
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone)
      .eq('merchant_id', merchantId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Client non trouvé', found: false },
        { status: 404 }
      );
    }

    // Récupérer la carte de fidélité avec les infos du commerçant
    const { data: card, error: cardError } = await supabaseAdmin
      .from('loyalty_cards')
      .select(`
        *,
        merchant:merchants (*)
      `)
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchantId)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Carte non trouvée', found: false },
        { status: 404 }
      );
    }

    // Récupérer l'historique des visites
    const { data: visits } = await supabaseAdmin
      .from('visits')
      .select('*')
      .eq('loyalty_card_id', card.id)
      .order('visited_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      found: true,
      customer,
      card: {
        ...card,
        customer,
      },
      visits: visits || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
