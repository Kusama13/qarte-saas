import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(`preview:${ip}`, { maxRequests: 30, windowMs: 60 * 1000 });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  const { data: merchant, error } = await supabaseAdmin
    .from('merchants')
    .select('id, shop_name, shop_type, logo_url, primary_color, secondary_color, stamps_required, reward_description, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode, product_name, review_link, referral_program_enabled, referral_reward_referrer, referral_reward_referred, booking_url, instagram_url, facebook_url, tiktok_url, country')
    .eq('id', id)
    .maybeSingle();

  if (error || !merchant) {
    return NextResponse.json({ error: 'Commerçant introuvable' }, { status: 404 });
  }

  return NextResponse.json({ merchant });
}
