import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loyaltyCardId = searchParams.get('loyalty_card_id');

    if (!loyaltyCardId) {
      return NextResponse.json(
        { error: 'loyalty_card_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: redemptions, error } = await supabase
      .from('redemptions')
      .select('id, redeemed_at, stamps_used, tier')
      .eq('loyalty_card_id', loyaltyCardId)
      .order('redeemed_at', { ascending: false });

    if (error) {
      console.error('Error fetching redemptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch redemptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ redemptions: redemptions || [] });
  } catch (error) {
    console.error('Redemptions API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
