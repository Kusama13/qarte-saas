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
});

// GET: Rechercher un client par téléphone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (customer) {
      return NextResponse.json({ customer, exists: true });
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
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { phone_number, first_name, last_name } = parsed.data;

    // Vérifier si le client existe déjà
    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (existing) {
      return NextResponse.json({ customer: existing });
    }

    // Créer le nouveau client
    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        phone_number,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
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

    return NextResponse.json({ customer: newCustomer });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
