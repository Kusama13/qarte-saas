import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { generateReferralCode, getTodayForCountry } from '@/lib/utils';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import logger from '@/lib/logger';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = getSupabaseAdmin();

// POST: Récupérer les détails d'une carte de fidélité d'un client (C5 fix: phone in body, not URL)
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 req/min par IP pour bloquer le bruteforce
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`customer-card:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const phone = getAuthenticatedPhone(request);
    if (!phone) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const merchantId = body.merchant_id;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchant_id requis' },
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

    // Auto-generate referral_code if missing (with uniqueness retry)
    if (!card.referral_code) {
      let code = generateReferralCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabaseAdmin
          .from('loyalty_cards')
          .select('id')
          .eq('referral_code', code)
          .maybeSingle();
        if (!existing) break;
        code = generateReferralCode();
      }
      await supabaseAdmin
        .from('loyalty_cards')
        .update({ referral_code: code })
        .eq('id', card.id);
      card.referral_code = code;
    }

    // Fetch all additional data in parallel (including planning if enabled)
    const merchant = card.merchant as Record<string, unknown>;
    const planningEnabled = !!merchant.planning_enabled;
    const today = planningEnabled ? getTodayForCountry(merchant.country as string) : '';
    const slotSelect = 'id, slot_date, start_time, deposit_confirmed, booked_online, primary_slot_id, planning_slot_services(service_id, service:merchant_services!service_id(name))';

    const [visitsResult, adjustmentsResult, memberCardResult, redemptionsResult, vouchersResult, upcomingResult, pastResult] = await Promise.all([
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
        .order('adjusted_at', { ascending: false })
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

      // Vouchers (referral rewards)
      supabaseAdmin
        .from('vouchers')
        .select('*, merchant_offers(title)')
        .eq('customer_id', customer.id)
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false }),

      // Upcoming appointments
      planningEnabled
        ? supabaseAdmin
            .from('merchant_planning_slots')
            .select(slotSelect)
            .eq('merchant_id', merchantId)
            .eq('customer_id', customer.id)
            .gte('slot_date', today)
            .not('client_name', 'is', null)
            .is('primary_slot_id', null)
            .order('slot_date')
            .order('start_time')
            .limit(3)
        : Promise.resolve({ data: [] }),

      // Past appointments (for history)
      planningEnabled
        ? supabaseAdmin
            .from('merchant_planning_slots')
            .select(slotSelect)
            .eq('merchant_id', merchantId)
            .eq('customer_id', customer.id)
            .lt('slot_date', today)
            .not('client_name', 'is', null)
            .is('primary_slot_id', null)
            .order('slot_date', { ascending: false })
            .order('start_time', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] }),
    ]);

    const upcomingAppointments = upcomingResult.data || [];
    const pastAppointments = pastResult.data || [];

    // Process offer data from merchant (already included in card.merchant)
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
      vouchers: vouchersResult.data || [],
      offer: offer.active ? offer : null,
      pwaOffer: merchant.pwa_offer_text || null,
      upcomingAppointments,
      pastAppointments,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    logger.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
