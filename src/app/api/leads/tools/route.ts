import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Save a tool lead
export async function POST(request: NextRequest) {
  try {
    const { email, source, generatedValue, businessName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!source) {
      return NextResponse.json({ error: 'Source required' }, { status: 400 });
    }

    // Validate source
    const validSources = ['qr-menu', 'google-review', 'ebook'];
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    // Try to insert, update if already exists for this source
    const { error } = await supabaseAdmin
      .from('tool_leads')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source,
          generated_value: generatedValue || null,
          business_name: businessName || null,
        },
        { onConflict: 'email,source' }
      );

    if (error) {
      console.error('Error saving tool lead:', error);
      // Don't fail the user experience if save fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tool lead error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET - Get all tool leads (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    let query = supabaseAdmin
      .from('tool_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: data || [] });
  } catch (error) {
    console.error('Fetch tool leads error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
