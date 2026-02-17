import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { setPhoneCookie } from '@/lib/customer-auth';

const supabaseAdmin = getSupabaseAdmin();

const lookupSchema = z.object({
  action: z.literal('lookup'),
  phone_number: z.string().min(10),
  merchant_id: z.string().uuid(),
});

const registerSchema = z.object({
  phone_number: z.string().min(10),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  merchant_id: z.string().uuid(),
});

// POST: Lookup or create a customer (phone in body, not URL — GDPR C5 fix)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json();

    // Dispatch: lookup vs register
    if (body.action === 'lookup') {
      return handleLookup(body, ip);
    }
    return handleRegister(body, ip);
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleLookup(body: unknown, ip: string) {
  const rateLimit = checkRateLimit(`register-lookup:${ip}`, { maxRequests: 15, windowMs: 60 * 1000 });
  if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { phone_number, merchant_id } = parsed.data;

  // Verify merchant exists
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('id', merchant_id)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
  }

  // 1. Check if customer exists for THIS merchant
  const { data: customersForMerchant } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('phone_number', phone_number)
    .eq('merchant_id', merchant_id)
    .limit(1);

  if (customersForMerchant && customersForMerchant.length > 0) {
    const response = NextResponse.json({
      customer: customersForMerchant[0],
      exists: true,
      existsForMerchant: true,
    });
    setPhoneCookie(response, phone_number);
    return response;
  }

  // 2. Check if customer exists at ANOTHER merchant (C4 fix: only return first_name, no last_name)
  const { data: customersGlobal } = await supabaseAdmin
    .from('customers')
    .select('first_name')
    .eq('phone_number', phone_number)
    .limit(1);

  if (customersGlobal && customersGlobal.length > 0) {
    return NextResponse.json({
      customer: { first_name: customersGlobal[0].first_name },
      exists: true,
      existsForMerchant: false,
      existsGlobally: true,
    });
  }

  return NextResponse.json({ customer: null, exists: false });
}

async function handleRegister(body: unknown, ip: string) {
  const rateLimit = checkRateLimit(`register-post:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { phone_number, first_name, last_name, merchant_id } = parsed.data;

  // Verify merchant exists
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('id', merchant_id)
    .maybeSingle();

  if (!merchant) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
  }

  // Check if already exists for this merchant
  const { data: existingList } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('phone_number', phone_number)
    .eq('merchant_id', merchant_id)
    .limit(1);

  if (existingList && existingList.length > 0) {
    const response = NextResponse.json({ customer: existingList[0] });
    setPhoneCookie(response, phone_number);
    return response;
  }

  // Create new customer
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

  const response = NextResponse.json({ customer: newCustomer });
  setPhoneCookie(response, phone_number);
  return response;
}
