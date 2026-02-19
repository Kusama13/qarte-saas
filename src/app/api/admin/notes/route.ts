import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';

// GET - Retrieve admin notes
export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-notes');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { data, error } = await supabaseAdmin
      .from('admin_notes')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data?.content || '' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update admin notes
export async function PUT(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-notes');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { content } = await request.json();

    // Upsert the notes
    const { error } = await supabaseAdmin
      .from('admin_notes')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001', // Fixed ID for single note
        content: content || '',
        updated_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
