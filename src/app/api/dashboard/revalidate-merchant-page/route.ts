import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

// POST /api/dashboard/revalidate-merchant-page
// Force-revalidates the public vitrine (/[locale]/p/[slug]) after the merchant
// changes settings in the dashboard. Without this, the ISR cache (1h) keeps serving
// stale HTML — e.g. hide_address_on_public_page toggled but address still visible.
export async function POST() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('slug')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!merchant?.slug) return NextResponse.json({ error: 'Marchand introuvable' }, { status: 404 });

    revalidatePath(`/fr/p/${merchant.slug}`);
    revalidatePath(`/en/p/${merchant.slug}`);

    return NextResponse.json({ success: true, slug: merchant.slug });
  } catch (error) {
    logger.error('Revalidate merchant page error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
