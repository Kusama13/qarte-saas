import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { setPhoneCookie } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

// POST: Customer login — verify phone exists anywhere, set HttpOnly cookie
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`customer-login:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

    const { phone_number } = await request.json();

    if (!phone_number || typeof phone_number !== 'string' || phone_number.length < 10) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 });
    }

    // Check if any customer exists with this phone
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone_number', phone_number)
      .limit(1)
      .maybeSingle();

    // Always return same response to prevent phone enumeration
    const response = NextResponse.json({ found: true });
    if (customer) {
      return setPhoneCookie(response, phone_number);
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
