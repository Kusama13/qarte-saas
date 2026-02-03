import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabaseAdmin = getSupabaseAdmin();

// Helper to verify merchant ownership
async function verifyMerchantOwnership(merchantId: string): Promise<{ authorized: boolean; error?: string }> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: 'Non autorisé - connexion requise' };
  }

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return { authorized: false, error: 'Non autorisé - vous ne pouvez pas gérer les clients de ce commerce' };
  }

  return { authorized: true };
}

const registerSchema = z.object({
  phone_number: z.string().min(10),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
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

    // SECURITY: Verify merchant ownership
    const authCheck = await verifyMerchantOwnership(merchantId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
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
  } catch {
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

    const { phone_number, first_name, last_name, merchant_id } = parsed.data;

    // SECURITY: Verify merchant ownership
    const authCheck = await verifyMerchantOwnership(merchant_id);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 });
    }

    // Vérifier si le client existe déjà pour ce marchand
    const { data: existingList } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('merchant_id', merchant_id)
      .limit(1);

    if (existingList && existingList.length > 0) {
      return NextResponse.json({ customer: existingList[0] });
    }

    // Créer le nouveau client
    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        phone_number,
        first_name: first_name.trim(),
        last_name: last_name?.trim() || null,
        merchant_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du client' },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer: newCustomer });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
