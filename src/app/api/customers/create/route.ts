import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseAdmin = getSupabaseAdmin();

// POST - Create a customer with loyalty card
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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
      .select('id, stamps_required')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Commerçant introuvable' },
        { status: 404 }
      );
    }

    const { first_name, last_name, phone_number } = await request.json();

    if (!first_name?.trim() || !phone_number?.trim()) {
      return NextResponse.json(
        { error: 'Prénom et téléphone requis' },
        { status: 400 }
      );
    }

    const phoneFormatted = phone_number.trim();

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
          { error: 'Ce client a déjà une carte fidélité chez vous' },
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
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json(
          { error: 'Erreur lors de la création du client' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Create loyalty card for this customer
    const { data: card, error: cardError } = await supabaseAdmin
      .from('loyalty_cards')
      .insert({
        customer_id: customerId,
        merchant_id: merchant.id,
        current_stamps: 0,
        stamps_target: merchant.stamps_required,
      })
      .select()
      .single();

    if (cardError) {
      console.error('Error creating loyalty card:', cardError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la carte fidélité' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer_id: customerId,
      loyalty_card_id: card.id,
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
