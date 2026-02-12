import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

// GET: Récupérer la carte membre d'un client pour un commerçant
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 20 per minute per IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`member-cards-customer:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const merchantId = searchParams.get('merchant_id');

    if (!customerId || !merchantId) {
      return NextResponse.json(
        { error: 'customer_id et merchant_id requis' },
        { status: 400 }
      );
    }

    // Get member card with program info (filtered by merchant through program)
    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        program:member_programs!inner (
          id,
          name,
          benefit_label,
          merchant_id,
          merchant:merchants (shop_name, logo_url, primary_color)
        )
      `)
      .eq('customer_id', customerId)
      .eq('program.merchant_id', merchantId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member card:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memberCard: memberCard || null });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
