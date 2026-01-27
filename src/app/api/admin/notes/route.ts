import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

// GET - Retrieve admin notes
export async function GET() {
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
export async function PUT(request: Request) {
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
