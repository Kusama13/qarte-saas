import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Récupérer toutes les cartes de fidélité d'un client par téléphone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log('GET /api/customers/cards - phone:', phone);

    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Récupérer TOUS les clients avec ce numéro (un par commerçant)
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, phone_number, first_name, last_name, merchant_id')
      .eq('phone_number', phone);

    console.log('Customers found:', customers, 'Error:', customersError);

    if (!customers || customers.length === 0) {
      return NextResponse.json({ cards: [], found: false, debug: { phone, customersError } });
    }

    // Récupérer les cartes de fidélité pour TOUS ces clients
    const customerIds = customers.map(c => c.id);

    const { data: cardsData, error: cardsError } = await supabaseAdmin
      .from('loyalty_cards')
      .select(`
        current_stamps,
        last_visit_date,
        merchant:merchants (
          id,
          shop_name,
          scan_code,
          logo_url,
          primary_color,
          stamps_required
        )
      `)
      .in('customer_id', customerIds);

    if (cardsError) {
      console.error('Cards fetch error:', cardsError);
      return NextResponse.json(
        { error: cardsError.message },
        { status: 500 }
      );
    }

    const cards = (cardsData || [])
      .filter((card: any) => card.merchant)
      .map((card: any) => ({
        merchant_id: card.merchant.id,
        shop_name: card.merchant.shop_name,
        scan_code: card.merchant.scan_code,
        logo_url: card.merchant.logo_url,
        primary_color: card.merchant.primary_color,
        stamps_required: card.merchant.stamps_required,
        current_stamps: card.current_stamps,
        last_visit_date: card.last_visit_date,
      }));

    return NextResponse.json({ cards, found: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
