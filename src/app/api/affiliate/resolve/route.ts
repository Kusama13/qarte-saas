import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Lookup partenaires externes (affiliate_links)
  const { data: link } = await supabaseAdmin
    .from('affiliate_links')
    .select('name')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (link) {
    return NextResponse.json(
      { name: link.name },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }

  // 2. Fallback : parrainage merchant->merchant via slug du salon parrain
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('shop_name')
    .eq('slug', slug)
    .maybeSingle();

  if (merchant) {
    return NextResponse.json(
      { name: merchant.shop_name },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
