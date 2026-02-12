import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`merchant-check:${ip}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ exists: false });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ exists: false });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({ exists: !!merchant });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
