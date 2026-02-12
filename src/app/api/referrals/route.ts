import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone, generateReferralCode } from '@/lib/utils';
import { z } from 'zod';
import type { MerchantCountry } from '@/types';

const supabaseAdmin = getSupabaseAdmin();

// ── GET: Récupérer les infos d'un code parrainage (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Code requis' }, { status: 400 });
    }

    // Trouver la loyalty card du parrain via referral_code
    const { data: card } = await supabaseAdmin
      .from('loyalty_cards')
      .select('id, customer_id, merchant_id')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle();

    if (!card) {
      return NextResponse.json({ valid: false });
    }

    // Récupérer le merchant + customer (parrain)
    const [merchantResult, customerResult] = await Promise.all([
      supabaseAdmin
        .from('merchants')
        .select('id, shop_name, scan_code, primary_color, logo_url, referral_program_enabled, referral_reward_referred')
        .eq('id', card.merchant_id)
        .single(),
      supabaseAdmin
        .from('customers')
        .select('first_name')
        .eq('id', card.customer_id)
        .single(),
    ]);

    if (!merchantResult.data || !merchantResult.data.referral_program_enabled) {
      return NextResponse.json({ valid: false });
    }

    const merchant = merchantResult.data;
    const referrer = customerResult.data;

    return NextResponse.json({
      valid: true,
      referrer_name: referrer?.first_name || 'Un ami',
      shop_name: merchant.shop_name,
      merchant_id: merchant.id,
      scan_code: merchant.scan_code,
      reward_for_you: merchant.referral_reward_referred,
      primary_color: merchant.primary_color,
      logo_url: merchant.logo_url,
    });
  } catch (error) {
    console.error('Referral info error:', error);
    return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST: Inscription filleul via parrainage
const referralSchema = z.object({
  referral_code: z.string().min(1),
  phone_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = referralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { referral_code, phone_number, first_name, last_name } = parsed.data;

    // 1. Trouver la loyalty card du parrain
    const { data: referrerCard } = await supabaseAdmin
      .from('loyalty_cards')
      .select('id, customer_id, merchant_id')
      .eq('referral_code', referral_code.toUpperCase())
      .maybeSingle();

    if (!referrerCard) {
      return NextResponse.json({ error: 'Code parrainage invalide' }, { status: 400 });
    }

    // 2. Récupérer le merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', referrerCard.merchant_id)
      .single();

    if (!merchant || !merchant.referral_program_enabled) {
      return NextResponse.json({ error: 'Programme de parrainage non actif' }, { status: 400 });
    }

    // 3. Formater et valider le téléphone
    const country = (merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number, country);
    if (!validatePhone(formattedPhone, country)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // 4. Vérifier que filleul ≠ parrain
    const { data: referrerCustomer } = await supabaseAdmin
      .from('customers')
      .select('phone_number, first_name')
      .eq('id', referrerCard.customer_id)
      .single();

    if (referrerCustomer?.phone_number === formattedPhone) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous parrainer vous-même' }, { status: 400 });
    }

    // 5. Vérifier si le filleul existe déjà chez ce merchant
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone_number', formattedPhone)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Vous êtes déjà client(e) de cet établissement' },
        { status: 409 }
      );
    }

    // 6. Créer le customer filleul
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
      console.error('Customer creation error:', customerError);
      return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
    }

    // 7. Créer la loyalty card du filleul
    const { data: newCard, error: cardError } = await supabaseAdmin
      .from('loyalty_cards')
      .insert({
        customer_id: newCustomer.id,
        merchant_id: merchant.id,
        current_stamps: 0,
        stamps_target: merchant.stamps_required,
        referral_code: generateReferralCode(),
      })
      .select()
      .single();

    if (cardError || !newCard) {
      console.error('Card creation error:', cardError);
      return NextResponse.json({ error: 'Erreur lors de la création de la carte' }, { status: 500 });
    }

    // 8. Créer le voucher filleul
    const { data: referredVoucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        loyalty_card_id: newCard.id,
        merchant_id: merchant.id,
        customer_id: newCustomer.id,
        reward_description: merchant.referral_reward_referred || 'Récompense parrainage',
      })
      .select()
      .single();

    if (voucherError || !referredVoucher) {
      console.error('Voucher creation error:', voucherError);
      return NextResponse.json({ error: 'Erreur lors de la création de la récompense' }, { status: 500 });
    }

    // 9. Créer le referral record (status pending, pas de voucher parrain encore)
    const { error: referralError } = await supabaseAdmin
      .from('referrals')
      .insert({
        merchant_id: merchant.id,
        referrer_customer_id: referrerCard.customer_id,
        referrer_card_id: referrerCard.id,
        referred_customer_id: newCustomer.id,
        referred_card_id: newCard.id,
        referred_voucher_id: referredVoucher.id,
        referrer_voucher_id: null,
        status: 'pending',
      });

    if (referralError) {
      console.error('Referral creation error:', referralError);
    }

    // 10. Retourner succès
    return NextResponse.json({
      success: true,
      customer_id: newCustomer.id,
      merchant_id: merchant.id,
      referrer_name: referrerCustomer?.first_name || 'Un ami',
      referred_reward: merchant.referral_reward_referred,
      shop_name: merchant.shop_name,
    });
  } catch (error) {
    console.error('Referral registration error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
