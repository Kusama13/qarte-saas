import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import logger from '@/lib/logger';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = getSupabaseAdmin();

// POST: Récupérer toutes les cartes de fidélité d'un client (auth via cookie)
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 req/min par IP pour bloquer le bruteforce
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`customer-cards:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
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

    // Récupérer TOUS les clients avec ce numéro (un par commerçant)
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('id, phone_number, first_name, last_name, merchant_id')
      .eq('phone_number', phone);

    if (!customers || customers.length === 0) {
      return NextResponse.json({ cards: [], found: false });
    }

    // Récupérer les cartes de fidélité pour TOUS ces clients
    const customerIds = customers.map(c => c.id);

    const { data: cardsData, error: cardsError } = await supabaseAdmin
      .from('loyalty_cards')
      .select(`
        id,
        current_stamps,
        last_visit_date,
        merchant:merchants (
          id,
          shop_name,
          scan_code,
          logo_url,
          primary_color,
          stamps_required,
          reward_description,
          tier2_enabled,
          tier2_stamps_required,
          tier2_reward_description
        )
      `)
      .in('customer_id', customerIds);

    if (cardsError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des cartes' },
        { status: 500 }
      );
    }

    // Get card IDs to fetch redemptions
    const cardIds = (cardsData || []).map((c) => c.id);

    // Fetch redemptions for all cards to know if tier 1 was redeemed in the current cycle
    // Guard: .in() with empty array would return ALL rows
    let redemptionsData: { loyalty_card_id: string; tier: number; redeemed_at: string }[] | null = null;
    if (cardIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('redemptions')
        .select('loyalty_card_id, tier, redeemed_at')
        .in('loyalty_card_id', cardIds);
      redemptionsData = data;
    }

    // Create a map of card_id -> redemptions (tier + date, for cycle-aware checks)
    const redemptionsByCard: Record<string, { tier: number; redeemed_at: string }[]> = {};
    (redemptionsData || []).forEach((r) => {
      if (!redemptionsByCard[r.loyalty_card_id]) {
        redemptionsByCard[r.loyalty_card_id] = [];
      }
      redemptionsByCard[r.loyalty_card_id].push({ tier: r.tier || 1, redeemed_at: r.redeemed_at });
    });

    // Define merchant type for the select query result
    interface MerchantData {
      id: string;
      shop_name: string;
      scan_code: string;
      logo_url: string | null;
      primary_color: string;
      stamps_required: number;
      reward_description: string | null;
      tier2_enabled: boolean;
      tier2_stamps_required: number | null;
      tier2_reward_description: string | null;
    }

    const cards = (cardsData || [])
      .filter((card) => card.merchant)
      .map((card) => {
        // Supabase returns merchant as object (not array) with alias syntax
        const merchant = card.merchant as unknown as MerchantData;
        const tier2Enabled = merchant.tier2_enabled;
        const tier1Required = merchant.stamps_required;
        const tier2Required = merchant.tier2_stamps_required || tier1Required * 2;
        // tier1_redeemed = redeemed dans le CYCLE courant uniquement.
        // Dual : palier 1 utilisé après le dernier palier 2. Mono-palier : toujours
        // false (utiliser remet les tampons à 0, une carte "prête" n'a donc pas
        // pu être consommée ce cycle).
        const cardRedemptions = redemptionsByCard[card.id] || [];
        let tier1Redeemed = false;
        if (tier2Enabled) {
          const lastTier2 = cardRedemptions
            .filter((r) => r.tier === 2)
            .reduce((max, r) => Math.max(max, new Date(r.redeemed_at).getTime()), 0);
          tier1Redeemed = cardRedemptions.some(
            (r) => r.tier === 1 && new Date(r.redeemed_at).getTime() > lastTier2,
          );
        }

        return {
          merchant_id: merchant.id,
          shop_name: merchant.shop_name,
          scan_code: merchant.scan_code,
          logo_url: merchant.logo_url,
          primary_color: merchant.primary_color,
          stamps_required: merchant.stamps_required,
          reward_description: merchant.reward_description,
          current_stamps: card.current_stamps,
          last_visit_date: card.last_visit_date,
          tier2_enabled: tier2Enabled,
          tier2_stamps_required: tier2Required,
          tier2_reward_description: merchant.tier2_reward_description,
          tier1_redeemed: tier1Redeemed,
        };
      });

    const firstName = customers[0]?.first_name || null;
    const response = NextResponse.json({ cards, found: true, phone, first_name: firstName });
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
