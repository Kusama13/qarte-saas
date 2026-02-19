import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-incomplete-signups');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

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
