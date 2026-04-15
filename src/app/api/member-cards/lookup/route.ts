import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { getAllPhoneFormats, formatPhoneNumber } from '@/lib/utils';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// GET: Lookup member card by phone + merchant_id (public, for booking flow)
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`member-lookup:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const merchantId = searchParams.get('merchant_id');
    const country = searchParams.get('country') || 'FR';

    if (!phone || !merchantId) {
      return NextResponse.json({ error: 'phone et merchant_id requis' }, { status: 400 });
    }

    // Format and lookup customer by phone
    const formatted = formatPhoneNumber(phone, country as MerchantCountry);
    const phoneFormats = getAllPhoneFormats(formatted);

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, first_name')
      .in('phone_number', phoneFormats)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ memberCard: null });
    }

    // Lookup active member card with best discount
    const { data: memberCard } = await supabaseAdmin
      .from('member_cards')
      .select(`
        id,
        valid_until,
        program:member_programs!inner (
          id, name, benefit_label, discount_percent, skip_deposit, merchant_id
        )
      `)
      .eq('customer_id', customer.id)
      .eq('program.merchant_id', merchantId)
      .gt('valid_until', new Date().toISOString())
      .order('valid_until', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!memberCard) {
      return NextResponse.json({ memberCard: null });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = memberCard.program as any;

    return NextResponse.json({
      memberCard: {
        id: memberCard.id,
        first_name: customer.first_name,
        program_name: program.name,
        discount_percent: program.discount_percent || null,
        skip_deposit: program.skip_deposit || false,
        benefit_label: program.benefit_label,
      },
    });
  } catch (error) {
    logger.error('Member lookup error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
