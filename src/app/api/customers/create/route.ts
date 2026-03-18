import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { formatPhoneNumber, formatCurrency } from '@/lib/utils';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';
import { z } from 'zod';

const createCustomerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional().nullable(),
  phone_number: z.string().min(4).max(20),
  birth_month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  birth_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  initial_stamps: z.coerce.number().int().min(0).max(15).optional().nullable(),
  initial_amount: z.coerce.number().min(0).max(10000).optional().nullable(),
});

const supabaseAdmin = getSupabaseAdmin();

// POST - Create a customer with loyalty card
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get merchant for this user
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, stamps_required, country, loyalty_mode, locale')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Commerçant introuvable' },
        { status: 404 }
      );
    }

    const parsed = createCustomerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }
    const { first_name, last_name, phone_number, birth_month, birth_day, initial_amount, initial_stamps } = parsed.data;

    const merchantCountry: MerchantCountry = merchant.country || 'FR';
    const phoneFormatted = formatPhoneNumber(phone_number.trim(), merchantCountry);

    // Check if customer already exists for THIS merchant with this phone number
    const { data: existingCustomerForMerchant } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone_number', phoneFormatted)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    let customerId: string;

    if (existingCustomerForMerchant) {
      // Customer already exists for this merchant - check loyalty card
      const { data: existingCards } = await supabaseAdmin
        .from('loyalty_cards')
        .select('id')
        .eq('customer_id', existingCustomerForMerchant.id)
        .eq('merchant_id', merchant.id);

      if (existingCards && existingCards.length > 0) {
        return NextResponse.json(
          { error: 'Ce client a déjà une carte fidélité chez vous', customer_id: existingCustomerForMerchant.id, existing: true },
          { status: 409 }
        );
      }

      // Customer exists but no loyalty card - will create one below
      customerId = existingCustomerForMerchant.id;
    } else {
      // Create new customer for this merchant
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: first_name.trim(),
          last_name: last_name?.trim() || null,
          phone_number: phoneFormatted,
          merchant_id: merchant.id,
          birth_month: birth_month ? Number(birth_month) : null,
          birth_day: birth_day ? Number(birth_day) : null,
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        logger.error('Error creating customer:', customerError);
        return NextResponse.json(
          { error: 'Erreur lors de la création du client' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Create loyalty card for this customer
    const stampCount = initial_stamps && Number(initial_stamps) > 0 ? Number(initial_stamps) : 0;
    const cardInsert: Record<string, unknown> = {
      customer_id: customerId,
      merchant_id: merchant.id,
      current_stamps: stampCount,
      current_amount: merchant.loyalty_mode === 'cagnotte' && initial_amount && Number(initial_amount) > 0
        ? Number(initial_amount)
        : 0,
      stamps_target: merchant.stamps_required,
    };
    const { data: card, error: cardError } = await supabaseAdmin
      .from('loyalty_cards')
      .insert(cardInsert)
      .select()
      .single();

    if (cardError) {
      logger.error('Error creating loyalty card:', cardError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la carte fidélité' },
        { status: 500 }
      );
    }

    // Record creation in history (point_adjustment with reason)
    const isCagnotte = merchant.loyalty_mode === 'cagnotte';
    const isEn = merchant.locale === 'en';
    const parts: string[] = [isEn ? 'Customer creation' : 'Création du client'];
    if (stampCount > 0) parts.push(`${stampCount} ${isEn ? (stampCount > 1 ? 'visits' : 'visit') : (`passage${stampCount > 1 ? 's' : ''}`)}`);
    if (isCagnotte && initial_amount && Number(initial_amount) > 0) {
      parts.push(`${formatCurrency(Number(initial_amount), merchantCountry)} ${isEn ? 'accumulated' : 'cumulés'}`);
    }
    const reason = parts.join(' · ');

    await supabaseAdmin
      .from('point_adjustments')
      .insert({
        loyalty_card_id: card.id,
        merchant_id: merchant.id,
        customer_id: customerId,
        adjustment: stampCount,
        reason,
        adjusted_by: user.id,
      });

    return NextResponse.json({
      success: true,
      customer_id: customerId,
      loyalty_card_id: card.id,
    });
  } catch (error) {
    logger.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
