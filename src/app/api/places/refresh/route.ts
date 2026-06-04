import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { getMerchantGoogleReviews } from '@/lib/google-places';

// Appelé quand le merchant relie/enregistre sa fiche Google : fetch immédiat
// (warm du cache) + revalidation de la vitrine, pour un affichage direct sans
// attendre le 1er rendu / l'ISR. Force le re-fetch (le place_id vient de changer).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const admin = getSupabaseAdmin();
    const { data: merchant } = await admin
      .from('merchants')
      .select('id, slug, google_place_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!merchant) return NextResponse.json({ error: 'Marchand introuvable' }, { status: 404 });

    const placeId = (body.placeId as string | undefined)?.trim() || merchant.google_place_id;
    if (!placeId) return NextResponse.json({ ok: false, reason: 'no_place' });

    const data = await getMerchantGoogleReviews(merchant.id, placeId, true);

    // Rafraîchit la vitrine (ISR) pour un affichage immédiat des avis.
    try {
      revalidatePath(`/p/${merchant.slug}`);
      revalidatePath(`/en/p/${merchant.slug}`);
    } catch { /* revalidation best-effort */ }

    return NextResponse.json({ ok: !!data, rating: data?.rating ?? null, ratingCount: data?.ratingCount ?? 0 });
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
