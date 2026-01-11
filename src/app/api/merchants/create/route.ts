import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client avec service role (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, slug, shop_name, shop_type, shop_address, phone } = body;

    if (!user_id || !shop_name || !shop_type || !phone) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('merchants')
      .insert({
        user_id,
        slug,
        shop_name,
        shop_type,
        shop_address: shop_address || null,
        phone,
      })
      .select()
      .single();

    if (error) {
      console.error('Merchant creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
