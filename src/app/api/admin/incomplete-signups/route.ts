import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-incomplete-signups:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    // List all auth users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 500,
    });

    if (usersError) {
      return NextResponse.json({ error: 'Erreur récupération utilisateurs' }, { status: 500 });
    }

    // Get all merchant user_ids
    const { data: merchants } = await supabaseAdmin
      .from('merchants')
      .select('user_id');

    const merchantUserIds = new Set((merchants || []).map((m: { user_id: string }) => m.user_id));

    // Get super admin user_ids (exclude them)
    const { data: superAdmins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');

    const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

    // Filter: auth users who have no merchant, are not super admins, and created in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const incompleteSignups = (users || [])
      .filter((u) => {
        if (merchantUserIds.has(u.id)) return false;
        if (superAdminUserIds.has(u.id)) return false;
        if (!u.email) return false;
        if (new Date(u.created_at) < thirtyDaysAgo) return false;
        return true;
      })
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ incompleteSignups, count: incompleteSignups.length });
  } catch (error) {
    logger.error('Incomplete signups API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
