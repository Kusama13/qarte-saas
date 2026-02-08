import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-today-signups:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    // Get today's start in UTC (France is UTC+1 or UTC+2, but we'll use local server time for simplicity)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch merchants created today (include reward_description to check if program is configured)
    const { data: merchants, error: merchantsError } = await supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, shop_type, created_at, subscription_status, reward_description, phone')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (merchantsError) {
      return NextResponse.json({ error: 'Erreur récupération commerçants' }, { status: 500 });
    }

    // Fetch user emails for each merchant
    const userIds = (merchants || []).map((m) => m.user_id);
    const emailMap: Record<string, string> = {};

    for (const userId of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        emailMap[userId] = userData.user.email;
      }
    }

    const signups = (merchants || []).map((m) => ({
      id: m.id,
      shop_name: m.shop_name,
      shop_type: m.shop_type,
      created_at: m.created_at,
      subscription_status: m.subscription_status,
      user_email: emailMap[m.user_id] || null,
      has_program: m.reward_description !== null,
      phone: m.phone || null,
    }));

    return NextResponse.json({ signups, count: signups.length });
  } catch (error) {
    console.error('Today signups API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
