import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

const registerSchema = z.object({
  phone_number: z.string().min(10),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  merchant_id: z.string().uuid(),
});

// GET: Rechercher un client par téléphone
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`register-get:${ip}`, { maxRequests: 15, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const merchantId = searchParams.get('merchant_id');

    if (!phone || !merchantId) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et merchant_id requis' },
        { status: 400 }
      );
    }

    // NOTE: This is a PUBLIC endpoint used by customers scanning QR codes
    // No auth required - customers are not logged in when scanning

    // Verify merchant exists
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
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
    // Only return first_name for auto-fill, NOT full customer record (PII scoping)
    const { data: customersGlobal } = await supabaseAdmin
      .from('customers')
      .select('first_name, last_name')
      .eq('phone_number', phone)
      .limit(1);

    if (customersGlobal && customersGlobal.length > 0) {
      return NextResponse.json({
        customer: { first_name: customersGlobal[0].first_name, last_name: customersGlobal[0].last_name },
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
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`register-post:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { phone_number, first_name, last_name, merchant_id } = parsed.data;

    // NOTE: This is a PUBLIC endpoint used by customers scanning QR codes
    // No auth required - customers are not logged in when scanning

    // Verify merchant exists
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      );
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
