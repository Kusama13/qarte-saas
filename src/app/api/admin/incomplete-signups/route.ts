import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

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

    // Filter: auth users who have no merchant and are not super admins
    const incompleteSignups = (users || [])
      .filter((u) => !merchantUserIds.has(u.id) && !superAdminUserIds.has(u.id) && u.email)
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ incompleteSignups, count: incompleteSignups.length });
  } catch (error) {
    console.error('Incomplete signups API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
