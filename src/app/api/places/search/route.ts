import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { searchPlaces } from '@/lib/google-places';

// Proxy serveur de recherche de fiches Google (Text Search New).
// Garde la clé API côté serveur. Auth merchant requise (anti-abus).
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const q = new URL(request.url).searchParams.get('q')?.trim() || '';
    if (q.length < 3) return NextResponse.json({ results: [] });

    const results = await searchPlaces(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Erreur recherche' }, { status: 500 });
  }
}
