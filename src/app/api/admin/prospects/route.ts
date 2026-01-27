import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

const supabaseAdmin = getSupabaseAdmin();

const prospectSchema = z.object({
  business_name: z.string().min(1, 'Nom requis'),
  contact_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  source: z.enum(['cold_call', 'referral', 'website', 'social', 'other']).optional().default('other'),
  status: z.enum(['new', 'contacted', 'demo_scheduled', 'demo_done', 'trial', 'converted', 'lost']).optional().default('new'),
  notes: z.string().optional().nullable(),
  next_followup: z.string().optional().nullable(),
});

// GET - List all prospects with optional status filter
export async function GET(request: NextRequest) {
  // Verify admin authorization
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  // Rate limiting
  const rateLimit = checkRateLimit(`admin-prospects:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('prospects')
      .select('*')
      .order('next_followup', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get counts per status
    const { data: counts } = await supabaseAdmin
      .from('prospects')
      .select('status')
      .then(({ data }) => {
        const countMap: Record<string, number> = {
          new: 0,
          contacted: 0,
          demo_scheduled: 0,
          demo_done: 0,
          trial: 0,
          converted: 0,
          lost: 0,
        };
        data?.forEach(p => {
          if (p.status in countMap) countMap[p.status]++;
        });
        return { data: countMap };
      });

    return NextResponse.json({ prospects: data || [], counts });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new prospect
export async function POST(request: NextRequest) {
  // Verify admin authorization
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  // Rate limiting
  const rateLimit = checkRateLimit(`admin-prospects:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const validation = prospectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const insertData = {
      ...validation.data,
      email: validation.data.email || null,
    };

    const { data, error } = await supabaseAdmin
      .from('prospects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prospect: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Update a prospect
export async function PATCH(request: NextRequest) {
  // Verify admin authorization
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  // Rate limiting
  const rateLimit = checkRateLimit(`admin-prospects:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Prospect ID required' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('prospects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prospect: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete a prospect
export async function DELETE(request: NextRequest) {
  // Verify admin authorization
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  // Rate limiting
  const rateLimit = checkRateLimit(`admin-prospects:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Prospect ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('prospects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
