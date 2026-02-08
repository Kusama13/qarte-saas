import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('id, shop_name, shop_type, logo_url, primary_color, secondary_color, stamps_required, reward_description, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode, product_name, review_link')
    .eq('id', id)
    .single();

  if (error || !merchant) {
    return NextResponse.json({ error: 'Commerçant introuvable' }, { status: 404 });
  }

  return NextResponse.json({ merchant });
}
