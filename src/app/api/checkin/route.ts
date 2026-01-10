import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis } from '@/lib/utils';
import { z } from 'zod';

const checkinSchema = z.object({
  merchant_slug: z.string().min(1),
  phone_number: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = checkinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { merchant_slug, phone_number, first_name, last_name } = parsed.data;
    const formattedPhone = formatPhoneNumber(phone_number);

    if (!validateFrenchPhone(formattedPhone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('slug', merchant_slug)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      );
    }

    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', formattedPhone)
      .single();

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      if (!first_name) {
        return NextResponse.json(
          { error: 'Le prénom est requis pour créer un compte' },
          { status: 400 }
        );
      }

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          phone_number: formattedPhone,
          first_name: first_name.trim(),
          last_name: last_name?.trim() || null,
        })
        .select()
        .single();

      if (customerError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte' },
          { status: 500 }
        );
      }

      customer = newCustomer;
    }

    let loyaltyCard;
    const { data: existingCard } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchant.id)
      .single();

    if (existingCard) {
      loyaltyCard = existingCard;
    } else {
      const { data: newCard, error: cardError } = await supabase
        .from('loyalty_cards')
        .insert({
          customer_id: customer.id,
          merchant_id: merchant.id,
          current_stamps: 0,
        })
        .select()
        .single();

      if (cardError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création de la carte' },
          { status: 500 }
        );
      }

      loyaltyCard = newCard;
    }

    const today = getTodayInParis();
    if (loyaltyCard.last_visit_date === today) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vous avez déjà validé votre passage aujourd\'hui',
          current_stamps: loyaltyCard.current_stamps,
          required_stamps: merchant.stamps_required,
          reward_unlocked: loyaltyCard.current_stamps >= merchant.stamps_required,
        },
        { status: 429 }
      );
    }

    const newStamps = loyaltyCard.current_stamps + 1;

    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update({
        current_stamps: newStamps,
        last_visit_date: today,
      })
      .eq('id', loyaltyCard.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la carte' },
        { status: 500 }
      );
    }

    await supabase.from('visits').insert({
      loyalty_card_id: loyaltyCard.id,
      merchant_id: merchant.id,
      customer_id: customer.id,
      ip_address: ip,
    });

    const rewardUnlocked = newStamps >= merchant.stamps_required;

    return NextResponse.json({
      success: true,
      message: rewardUnlocked
        ? 'Félicitations ! Vous avez débloqué votre récompense !'
        : 'Passage enregistré avec succès',
      current_stamps: newStamps,
      required_stamps: merchant.stamps_required,
      reward_unlocked: rewardUnlocked,
      customer_name: customer.first_name,
    });
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
