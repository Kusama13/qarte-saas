import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = getSupabaseAdmin();

// GET: Récupérer les détails d'une carte de fidélité d'un client (API consolidée)
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 10 req/min par IP pour bloquer le bruteforce
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`customer-card:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

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

    // Fetch all additional data in parallel
    const [visitsResult, adjustmentsResult, memberCardResult, redemptionsResult] = await Promise.all([
      // Visits
      supabaseAdmin
        .from('visits')
        .select('*')
        .eq('loyalty_card_id', card.id)
        .order('visited_at', { ascending: false })
        .limit(20),

      // Adjustments
      supabaseAdmin
        .from('point_adjustments')
        .select('*')
        .eq('loyalty_card_id', card.id)
        .order('created_at', { ascending: false })
        .limit(20),

      // Member card with program info
      supabaseAdmin
        .from('member_cards')
        .select(`
          *,
          program:member_programs!inner (
            id,
            name,
            benefit_label,
            merchant_id,
            merchant:merchants (shop_name, logo_url, primary_color)
          )
        `)
        .eq('customer_id', customer.id)
        .eq('program.merchant_id', merchantId)
        .maybeSingle(),

      // Redemptions
      supabaseAdmin
        .from('redemptions')
        .select('id, redeemed_at, stamps_used, tier')
        .eq('loyalty_card_id', card.id)
        .order('redeemed_at', { ascending: false }),
    ]);

    // Process offer data from merchant (already included in card.merchant)
    const merchant = card.merchant as Record<string, unknown>;
    const isOfferExpired = merchant.offer_expires_at &&
      new Date(merchant.offer_expires_at as string) < new Date();

    const offer = {
      active: merchant.offer_active && !isOfferExpired,
      title: merchant.offer_title,
      description: merchant.offer_description,
      imageUrl: merchant.offer_image_url,
      expiresAt: merchant.offer_expires_at,
      durationDays: merchant.offer_duration_days,
      createdAt: merchant.offer_created_at,
      isExpired: isOfferExpired,
    };

    const response = NextResponse.json({
      found: true,
      customer,
      card: {
        ...card,
        customer,
      },
      visits: visitsResult.data || [],
      adjustments: adjustmentsResult.data || [],
      memberCard: memberCardResult.data || null,
      redemptions: redemptionsResult.data || [],
      offer: offer.active ? offer : null,
      pwaOffer: merchant.pwa_offer_text || null,
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
