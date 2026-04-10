import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { setPhoneCookie } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { formatPhoneNumber, getAllPhoneFormats } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

const supabaseAdmin = getSupabaseAdmin();

// POST: Customer login — verify phone exists anywhere, set HttpOnly cookie
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`customer-login:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

    const { phone_number, phone_country } = await request.json();

    if (!phone_number || typeof phone_number !== 'string' || phone_number.length < 10) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 });
    }

    // Normalize to E.164 (without +) using the provided country (default FR)
    // This ensures the cookie always stores the same format as customers.phone_number
    const country = (phone_country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number, country);

    // Lookup with cross-format tolerance (FR/BE/CH variants)
    const phoneVariants = getAllPhoneFormats(formattedPhone);
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, phone_number')
      .in('phone_number', phoneVariants)
      .limit(1)
      .maybeSingle();

    // Always return same response to prevent phone enumeration
    const response = NextResponse.json({ found: true });
    if (customer) {
      // Use the ACTUAL stored phone format so subsequent API calls match
      return setPhoneCookie(response, customer.phone_number);
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
