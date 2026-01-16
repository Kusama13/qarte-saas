import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const registerSchema = z.object({
  phone_number: z.string().min(10),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  merchant_id: z.string().uuid(),
});

// GET: Rechercher un client par téléphone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const merchantId = searchParams.get('merchant_id');

    if (!phone || !merchantId) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et merchant_id requis' },
        { status: 400 }
      );
    }

    // 1. Vérifier si le client existe déjà pour CE commerçant
    const { data: customersForMerchant } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone)
      .eq('merchant_id', merchantId)
      .limit(1);

    if (customersForMerchant && customersForMerchant.length > 0) {
      return NextResponse.json({
        customer: customersForMerchant[0],
        exists: true,
        existsForMerchant: true
      });
    }

    // 2. Vérifier si le client existe chez UN AUTRE commerçant (client Qarte existant)
    const { data: customersGlobal } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone)
      .limit(1);

    if (customersGlobal && customersGlobal.length > 0) {
      // Client existe ailleurs - retourner ses infos pour éviter de redemander nom/prénom
      return NextResponse.json({
        customer: customersGlobal[0],
        exists: true,
        existsForMerchant: false,
        existsGlobally: true
      });
    }

    return NextResponse.json({ customer: null, exists: false });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: Créer ou récupérer un client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/customers/register body:', body);

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { phone_number, first_name, last_name, merchant_id } = parsed.data;

    // Vérifier si le client existe déjà pour ce marchand
    const { data: existingList } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('merchant_id', merchant_id)
      .limit(1);

    if (existingList && existingList.length > 0) {
      console.log('Customer already exists for merchant:', existingList[0]);
      return NextResponse.json({ customer: existingList[0] });
    }

    // Créer le nouveau client
    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        phone_number,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        merchant_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Customer creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Customer created:', newCustomer);
    return NextResponse.json({ customer: newCustomer });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
