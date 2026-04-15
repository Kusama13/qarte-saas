import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({ applications: data || [] });
  } catch (err) {
    console.error('[admin/affiliation/applications] GET error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
