import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// Client avec service role (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 créations par heure par IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`merchant-create:${ip}`, RATE_LIMITS.signup);

    if (!rateLimit.success) {
      logger.warn(`Rate limit exceeded for merchant creation: ${ip}`);
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();
    const { user_id, slug, shop_name, shop_type, shop_address, phone } = body;

    if (!user_id || !shop_name || !shop_type || !phone || !shop_address) {
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
        shop_address,
        phone,
      })
      .select()
      .single();

    if (error) {
      logger.error('Merchant creation error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant: data });
  } catch (error) {
    logger.error('API error', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
