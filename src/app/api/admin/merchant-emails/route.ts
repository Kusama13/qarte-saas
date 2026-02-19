import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-merchant-emails');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

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
    logger.error('Merchant emails API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
