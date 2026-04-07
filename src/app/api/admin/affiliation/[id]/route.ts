import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  commission_percent: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('affiliate_links')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    return NextResponse.json({ link: data });
  } catch (err) {
    console.error('[admin/affiliation] PATCH error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;
  const { id } = await params;

  try {
    // Check if any merchants are linked
    const { data: link } = await supabaseAdmin
      .from('affiliate_links')
      .select('slug')
      .eq('id', id)
      .single();

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const { count } = await supabaseAdmin
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .eq('signup_source', `affiliate_${link.slug}`);

    if (count && count > 0) {
      // Soft delete if merchants exist
      await supabaseAdmin
        .from('affiliate_links')
        .update({ active: false })
        .eq('id', id);
      return NextResponse.json({ message: 'Link deactivated (merchants exist)' });
    }

    // Hard delete if no merchants
    await supabaseAdmin.from('affiliate_links').delete().eq('id', id);
    return NextResponse.json({ message: 'Link deleted' });
  } catch (err) {
    console.error('[admin/affiliation] DELETE error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
