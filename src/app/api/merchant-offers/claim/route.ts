import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone, getAllPhoneFormats, generateReferralCode, getTrialStatus } from '@/lib/utils';
import { z } from 'zod';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// ── GET: Valider une offre (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');

    if (!offerId) {
      return NextResponse.json({ error: 'offerId requis' }, { status: 400 });
    }

    const { data: offer } = await supabaseAdmin
      .from('merchant_offers')
      .select('id, merchant_id, title, description, expires_at, max_claims, claim_count')
      .eq('id', offerId)
      .eq('active', true)
      .maybeSingle();

    if (!offer) {
      return NextResponse.json({ error: 'Offre introuvable ou expirée' }, { status: 404 });
    }

    // Check expiration
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cette offre a expiré' }, { status: 410 });
    }

    // Check max claims
    if (offer.max_claims && offer.claim_count >= offer.max_claims) {
      return NextResponse.json({ error: 'Cette offre n\'est plus disponible' }, { status: 410 });
    }

    // Fetch merchant info
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, shop_name, primary_color, logo_url')
      .eq('id', offer.merchant_id)
      .single();

    return NextResponse.json({
      valid: true,
      is_offer: true,
      offer_id: offer.id,
      offer_title: offer.title,
      offer_description: offer.description,
      shop_name: merchant?.shop_name,
      merchant_id: offer.merchant_id,
      primary_color: merchant?.primary_color,
      logo_url: merchant?.logo_url,
    });
  } catch (error) {
    logger.error('Offer validation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST: Inscription client via offre promo
const claimSchema = z.object({
  offer_id: z.string().uuid(),
  phone_number: z.string().min(1),
  phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
  first_name: z.string().min(1),
  last_name: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`offer-claim:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();
    const parsed = claimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { offer_id, phone_number, first_name, last_name } = parsed.data;

    // 1. Trouver l'offre active
    const { data: offer } = await supabaseAdmin
      .from('merchant_offers')
      .select('*')
      .eq('id', offer_id)
      .eq('active', true)
      .maybeSingle();

    if (!offer) {
      return NextResponse.json({ error: 'Offre introuvable ou désactivée' }, { status: 400 });
    }

    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cette offre a expiré' }, { status: 410 });
    }

    // max_claims check is done atomically by increment_offer_claim RPC (step 5)

    // 2. Trouver le merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', offer.merchant_id)
      .is('deleted_at', null)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (trialStatus.isFullyExpired) {
      return NextResponse.json({ error: 'Ce commerce n\'accepte plus les inscriptions pour le moment.' }, { status: 403 });
    }

    // 3. Formater et valider le téléphone
    const country = (parsed.data.phone_country || merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number, country);
    if (!validatePhone(formattedPhone, country)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // 4. Vérifier si le client existe déjà
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .in('phone_number', getAllPhoneFormats(formattedPhone))
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    let customerId: string;
    let cardId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;

      // Get existing card
      const { data: existingCard } = await supabaseAdmin
        .from('loyalty_cards')
        .select('id')
        .eq('customer_id', customerId)
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      if (!existingCard) {
        return NextResponse.json({ error: 'Carte de fidélité introuvable' }, { status: 500 });
      }
      cardId = existingCard.id;

      // Check if this customer already claimed this offer
      const { data: existingVoucher } = await supabaseAdmin
        .from('vouchers')
        .select('id')
        .eq('customer_id', customerId)
        .eq('offer_id', offer_id)
        .maybeSingle();

      if (existingVoucher) {
        return NextResponse.json(
          { error: 'Vous avez déjà utilisé cette offre' },
          { status: 409 }
        );
      }
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          phone_number: formattedPhone,
          first_name: first_name.trim(),
          last_name: last_name?.trim() || null,
          merchant_id: merchant.id,
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        logger.error('Offer claim customer creation error:', customerError);
        return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
      }
      customerId = newCustomer.id;

      // Create loyalty card
      const { data: newCard, error: cardError } = await supabaseAdmin
        .from('loyalty_cards')
        .insert({
          customer_id: newCustomer.id,
          merchant_id: merchant.id,
          current_stamps: 0,
          current_amount: 0,
          stamps_target: merchant.stamps_required,
          referral_code: generateReferralCode(),
        })
        .select()
        .single();

      if (cardError || !newCard) {
        logger.error('Offer claim card creation error:', cardError);
        await supabaseAdmin.from('customers').delete().eq('id', newCustomer.id);
        return NextResponse.json({ error: 'Erreur lors de la création de la carte' }, { status: 500 });
      }
      cardId = newCard.id;
    }

    // 5. Incrémenter le compteur AVANT de créer le voucher (atomique — évite les race conditions)
    const { data: claimSuccess } = await supabaseAdmin.rpc('increment_offer_claim', {
      p_offer_id: offer.id,
    });

    if (!claimSuccess) {
      return NextResponse.json({ error: 'Cette offre n\'est plus disponible' }, { status: 410 });
    }

    // 6. Créer le voucher offre (expire dans 30 jours)
    const { data: offerVoucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        loyalty_card_id: cardId,
        merchant_id: merchant.id,
        customer_id: customerId,
        reward_description: offer.description,
        source: 'offer',
        offer_id: offer.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (voucherError || !offerVoucher) {
      logger.error('Offer voucher creation error:', voucherError);
      // Rollback: decrement claim count since voucher creation failed
      await supabaseAdmin.rpc('decrement_offer_claim', { p_offer_id: offer.id });
      return NextResponse.json({ error: 'Erreur lors de la création du bon' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_offer: true,
      customer_id: customerId,
      merchant_id: merchant.id,
      shop_name: merchant.shop_name,
      offer_title: offer.title,
      offer_description: offer.description,
    });
  } catch (error) {
    logger.error('Offer claim error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
