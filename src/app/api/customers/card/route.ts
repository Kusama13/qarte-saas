import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = getSupabaseAdmin();

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

    // Récupérer les ajustements manuels
    const { data: adjustments } = await supabaseAdmin
      .from('point_adjustments')
      .select('*')
      .eq('loyalty_card_id', card.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const response = NextResponse.json({
      found: true,
      customer,
      card: {
        ...card,
        customer,
      },
      visits: visits || [],
      adjustments: adjustments || [],
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
