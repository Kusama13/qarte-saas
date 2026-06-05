import { getSupabaseAdmin } from '@/lib/supabase';

// Intégration Google Places API (New) — note + avis de la fiche du salon.
// ToS : place_id stockable indéfiniment ; texte des avis en cache court (72h)
// uniquement. Coût maîtrisé : cache 72h + fetch-on-view, périmètre abonnés.

const PLACES_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CACHE_TTL_MS = 72 * 60 * 60 * 1000; // 72h

export type GoogleReview = {
  author: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string;
};

export type GoogleReviewsData = {
  rating: number;
  ratingCount: number;
  reviews: GoogleReview[];
  mapsUri: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReviews(raw: any[]): GoogleReview[] {
  return (raw || []).slice(0, 5).map((r) => ({
    author: r.authorAttribution?.displayName || 'Client Google',
    authorPhoto: r.authorAttribution?.photoUri || null,
    rating: Number(r.rating) || 0,
    text: r.originalText?.text || r.text?.text || '',
    relativeTime: r.relativePublishTimeDescription || '',
  }));
}

/** Appel direct Place Details (New). FieldMask = note + nb avis + lien + 5 avis. */
export async function fetchPlaceDetails(placeId: string, languageCode = 'fr'): Promise<GoogleReviewsData | null> {
  if (!PLACES_KEY || !placeId) return null;
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}`,
      {
        headers: {
          'X-Goog-Api-Key': PLACES_KEY,
          'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.rating !== 'number') return null;
    return {
      rating: data.rating,
      ratingCount: Number(data.userRatingCount) || 0,
      reviews: mapReviews(data.reviews),
      mapsUri: data.googleMapsUri || null,
    };
  } catch {
    return null;
  }
}

/**
 * Note + avis d'un salon, avec cache 72h en base.
 * Renvoie le cache si frais, sinon refetch + upsert. `null` propre si pas de
 * place_id / clé absente / erreur (la section vitrine est alors masquée).
 */
export async function getMerchantGoogleReviews(
  merchantId: string,
  placeId: string | null,
  force = false
): Promise<GoogleReviewsData | null> {
  if (!placeId || !PLACES_KEY) return null;
  const admin = getSupabaseAdmin();

  const { data: cached } = await admin
    .from('merchant_google_reviews_cache')
    .select('rating, rating_count, reviews, maps_uri, fetched_at')
    .eq('merchant_id', merchantId)
    .maybeSingle();

  const cachedData = (): GoogleReviewsData | null =>
    cached && cached.rating != null
      ? {
          rating: Number(cached.rating),
          ratingCount: Number(cached.rating_count),
          reviews: (cached.reviews as GoogleReview[]) || [],
          mapsUri: cached.maps_uri || null,
        }
      : null;

  const fresh = !force && cached?.fetched_at && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (fresh) return cachedData();

  const data = await fetchPlaceDetails(placeId);
  if (!data) return cachedData(); // fallback sur l'ancien cache si l'API échoue

  await admin
    .from('merchant_google_reviews_cache')
    .upsert(
      {
        merchant_id: merchantId,
        rating: data.rating,
        rating_count: data.ratingCount,
        reviews: data.reviews,
        maps_uri: data.mapsUri,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'merchant_id' }
    );

  return data;
}

/** Autocomplétion de fiches (Places Autocomplete New) pour relier un salon depuis le dashboard. */
export async function autocompletePlaces(input: string): Promise<{ placeId: string; name: string; address: string }[]> {
  if (!PLACES_KEY || input.trim().length < 3) return [];
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_KEY },
      body: JSON.stringify({ input, languageCode: 'fr' }),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.suggestions || [])
      .map((sg: any) => sg.placePrediction)
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        placeId: p.placeId,
        name: p.structuredFormat?.mainText?.text || p.text?.text || '',
        address: p.structuredFormat?.secondaryText?.text || '',
      }));
  } catch {
    return [];
  }
}
