import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

// GET - Retrieve admin notes
export async function GET(request: NextRequest) {
  // Verify admin authorization
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  // Rate limiting
  const rateLimit = checkRateLimit(`admin-notes:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

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
  // Verify admin authorization
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  // Rate limiting
  const rateLimit = checkRateLimit(`admin-notes:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

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
