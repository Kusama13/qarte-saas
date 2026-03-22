import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone, generateReferralCode, getTrialStatus } from '@/lib/utils';
import { z } from 'zod';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// ── GET: Valider un code welcome (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Code requis' }, { status: 400 });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, shop_name, primary_color, logo_url, welcome_offer_description')
      .eq('welcome_referral_code', code.toUpperCase())
      .eq('welcome_offer_enabled', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      is_welcome: true,
      shop_name: merchant.shop_name,
      merchant_id: merchant.id,
      welcome_offer_description: merchant.welcome_offer_description,
      primary_color: merchant.primary_color,
      logo_url: merchant.logo_url,
    });
  } catch (error) {
    logger.error('Welcome info error:', error);
    return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST: Inscription client via offre de bienvenue
const welcomeSchema = z.object({
  welcome_code: z.string().min(1),
  phone_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 per minute per IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`welcome:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();
    const parsed = welcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { welcome_code, phone_number, first_name, last_name } = parsed.data;

    // 1. Trouver le merchant via welcome code
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('welcome_referral_code', welcome_code.toUpperCase())
      .eq('welcome_offer_enabled', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ error: 'Code offre de bienvenue invalide' }, { status: 400 });
    }

    // Check subscription status
    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (trialStatus.isFullyExpired) {
      return NextResponse.json({ error: 'Ce commerce n\'accepte plus les inscriptions pour le moment.' }, { status: 403 });
    }

    // 2. Formater et valider le téléphone
    const country = (merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number, country);
    if (!validatePhone(formattedPhone, country)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // 3. Vérifier si le client existe déjà chez ce merchant
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone_number', formattedPhone)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    let customerId: string;
    let cardId: string;

    if (existingCustomer) {
      // Client exists — check eligibility (stamps + existing vouchers)
      const [cardRes, voucherRes] = await Promise.all([
        supabaseAdmin
          .from('loyalty_cards')
          .select('id, current_stamps')
          .eq('customer_id', existingCustomer.id)
          .eq('merchant_id', merchant.id)
          .maybeSingle(),
        supabaseAdmin
          .from('vouchers')
          .select('id, source')
          .eq('customer_id', existingCustomer.id)
          .eq('merchant_id', merchant.id)
          .in('source', ['welcome', 'referral'])
          .limit(1),
      ]);

      if (!cardRes.data) {
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
      }

      if (Number(cardRes.data.current_stamps || 0) > 0) {
        return NextResponse.json(
          { error: 'Vous faites déjà partie de nos fidèles ! Cette offre est réservée aux nouvelles clientes. Merci pour votre confiance.' },
          { status: 409 }
        );
      }

      if (voucherRes.data && voucherRes.data.length > 0) {
        return NextResponse.json(
          { error: 'Vous avez déjà bénéficié de cette offre. Au plaisir de vous revoir bientôt !' },
          { status: 409 }
        );
      }

      customerId = existingCustomer.id;
      cardId = cardRes.data.id;
    } else {
      // 4. Créer le customer
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
        logger.error('Welcome customer creation error:', customerError);
        return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
      }

      // 5. Créer la loyalty card
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
        logger.error('Welcome card creation error:', cardError);
        await supabaseAdmin.from('customers').delete().eq('id', newCustomer.id);
        return NextResponse.json({ error: 'Erreur lors de la création de la carte' }, { status: 500 });
      }

      customerId = newCustomer.id;
      cardId = newCard.id;
    }

    // 6. Créer le voucher welcome (expire dans 30 jours)
    const { data: welcomeVoucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        loyalty_card_id: cardId,
        merchant_id: merchant.id,
        customer_id: customerId,
        reward_description: merchant.welcome_offer_description || 'Offre de bienvenue',
        source: 'welcome',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (voucherError || !welcomeVoucher) {
      logger.error('Welcome voucher creation error:', voucherError);
      return NextResponse.json({ error: 'Erreur lors de la création de la récompense' }, { status: 500 });
    }

    // 7. Créer le referral record (parrain = Qarte = null, status completed)
    const { error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        merchant_id: merchant.id,
        referrer_customer_id: null,
        referrer_card_id: null,
        referred_customer_id: customerId,
        referred_card_id: cardId,
        referred_voucher_id: welcomeVoucher.id,
        referrer_voucher_id: null,
        status: 'completed',
      });

    if (referralError) {
      logger.error('Welcome referral creation error:', referralError);
      // Rollback: delete the voucher since referral tracking failed
      await supabaseAdmin.from('vouchers').delete().eq('id', welcomeVoucher.id);
      return NextResponse.json({ error: 'Erreur lors de la création de la récompense' }, { status: 500 });
    }

    // 8. Retourner succès
    return NextResponse.json({
      success: true,
      is_welcome: true,
      customer_id: customerId,
      merchant_id: merchant.id,
      shop_name: merchant.shop_name,
      welcome_reward: merchant.welcome_offer_description,
    });
  } catch (error) {
    logger.error('Welcome registration error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
