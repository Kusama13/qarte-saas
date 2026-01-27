import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Récupérer la carte membre d'un client pour un commerçant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const merchantId = searchParams.get('merchant_id');

    if (!customerId || !merchantId) {
      return NextResponse.json(
        { error: 'customer_id et merchant_id requis' },
        { status: 400 }
      );
    }

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        merchant:merchants (shop_name, logo_url, primary_color)
      `)
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error in this context)
      console.error('Error fetching member card:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return null if no card found (not an error)
    return NextResponse.json({ memberCard: memberCard || null });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
