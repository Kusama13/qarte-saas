import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-merchant-emails:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    const [{ data: merchants }, { data: { users } }] = await Promise.all([
      supabaseAdmin.from('merchants').select('user_id'),
      supabaseAdmin.auth.admin.listUsers({ perPage: 500 }),
    ]);

    const merchantUserIds = new Set((merchants || []).map((m: { user_id: string }) => m.user_id));
    const emails: Record<string, string> = {};

    (users || []).forEach((u) => {
      if (merchantUserIds.has(u.id) && u.email) {
        emails[u.id] = u.email;
      }
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Merchant emails API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
