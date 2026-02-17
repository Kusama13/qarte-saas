import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const supabaseAdmin = getSupabaseAdmin();

// GET: Check if customer is authenticated (reads HttpOnly cookie)
// Used by client pages for auto-login instead of reading phone from JS cookie
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`customer-me:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
    if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

    const phone = getAuthenticatedPhone(request);
    if (!phone) {
      return NextResponse.json({ authenticated: false });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id');

    // If merchant_id provided, check if customer exists at that merchant
    if (merchantId) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('id, first_name')
        .eq('phone_number', phone)
        .eq('merchant_id', merchantId)
        .maybeSingle();

      if (customer) {
        return NextResponse.json({
          authenticated: true,
          phone,
          existsForMerchant: true,
          customer: { id: customer.id, first_name: customer.first_name },
        });
      }

      // Check if exists globally (at another merchant)
      const { data: globalCustomer } = await supabaseAdmin
        .from('customers')
        .select('first_name')
        .eq('phone_number', phone)
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        authenticated: true,
        phone,
        existsForMerchant: false,
        existsGlobally: !!globalCustomer,
        customer: globalCustomer ? { first_name: globalCustomer.first_name } : null,
      });
    }

    // No merchant_id — just confirm auth status
    return NextResponse.json({ authenticated: true, phone });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
