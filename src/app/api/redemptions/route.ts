import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`redemptions:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const loyaltyCardId = searchParams.get('loyalty_card_id');
    const phoneNumber = searchParams.get('phone');

    if (!loyaltyCardId || !phoneNumber) {
      return NextResponse.json(
        { error: 'loyalty_card_id and phone are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // SECURITY: Always verify phone matches the card's customer
    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('customer_id, customer:customers(phone_number)')
      .eq('id', loyaltyCardId)
      .maybeSingle();

    const customerData = card?.customer as unknown as { phone_number: string } | null;
    if (!card || customerData?.phone_number !== phoneNumber) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

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
