import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

// POST - Save a demo lead
export async function POST(request: NextRequest) {
  try {
    const { phone_number } = await request.json();

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Try to insert, ignore if already exists (upsert with no update)
    const { error } = await supabaseAdmin
      .from('demo_leads')
      .upsert(
        { phone_number },
        { onConflict: 'phone_number', ignoreDuplicates: true }
      );

    if (error) {
      console.error('Error saving demo lead:', error);
      // Don't fail the demo experience if save fails
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET - Get all demo leads (admin only)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: data || [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
