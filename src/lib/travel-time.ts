// Service durée de trajet pour le mode "à domicile".
//
// - Géocodage : api-adresse.data.gouv.fr (BAN, France, gratuit, sans clé)
// - Routing   : OpenRouteService (gratuit jusqu'à 2000 req/jour, OSM)
// - Cache     : table Postgres travel_time_cache, clé = coords arrondies 4 décimales
// - Fallback  : si ORS répond une erreur, distance à vol d'oiseau × 1.4 / 30 km/h
//
// Server-only (utilise supabaseAdmin).

import { getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const BAN_URL = 'https://api-adresse.data.gouv.fr/search/';
const FALLBACK_AVG_SPEED_KMH = 30;
const FALLBACK_ROUTE_FACTOR = 1.4;

export interface Coords {
  lat: number;
  lng: number;
}

export interface GeocodeResult extends Coords {
  label: string;
  postcode?: string;
  city?: string;
}

export function roundCoord(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function cacheKey(c: Coords): string {
  return `${roundCoord(c.lat)},${roundCoord(c.lng)}`;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length < 3) return null;
  try {
    const res = await fetch(`${BAN_URL}?q=${encodeURIComponent(query)}&limit=1`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.geometry.coordinates;
    return {
      lat,
      lng,
      label: feature.properties.label,
      postcode: feature.properties.postcode,
      city: feature.properties.city,
    };
  } catch (err) {
    logger.warn('geocodeAddress failed', { query, err: String(err) });
    return null;
  }
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fallbackMinutes(origin: Coords, dest: Coords): number {
  const km = haversineKm(origin, dest) * FALLBACK_ROUTE_FACTOR;
  return Math.max(1, Math.round((km / FALLBACK_AVG_SPEED_KMH) * 60));
}

async function fetchOrs(origin: Coords, dest: Coords): Promise<number | null> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    logger.warn('OPENROUTESERVICE_API_KEY missing — using haversine fallback');
    return null;
  }

  try {
    const res = await fetch(ORS_URL, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [dest.lng, dest.lat],
        ],
        instructions: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      logger.warn('ORS non-OK response', { status: res.status });
      return null;
    }

    const data = await res.json();
    const seconds = data.routes?.[0]?.summary?.duration;
    if (typeof seconds !== 'number') return null;
    return Math.max(1, Math.round(seconds / 60));
  } catch (err) {
    logger.warn('ORS request failed', { err: String(err) });
    return null;
  }
}

/**
 * Returns travel duration in minutes from origin to dest.
 * Cache-first → ORS → Haversine fallback. Always succeeds (fallback is final).
 */
export async function getTravelTime(origin: Coords, dest: Coords): Promise<number> {
  const supabase = getSupabaseAdmin();
  const originKey = cacheKey(origin);
  const destKey = cacheKey(dest);

  if (originKey === destKey) return 0;

  const { data: cached } = await supabase
    .from('travel_time_cache')
    .select('duration_minutes')
    .eq('origin_key', originKey)
    .eq('dest_key', destKey)
    .maybeSingle();

  if (cached?.duration_minutes != null) {
    return cached.duration_minutes;
  }

  const ors = await fetchOrs(origin, dest);
  const minutes = ors ?? fallbackMinutes(origin, dest);

  await supabase
    .from('travel_time_cache')
    .upsert(
      { origin_key: originKey, dest_key: destKey, duration_minutes: minutes },
      { onConflict: 'origin_key,dest_key' }
    );

  return minutes;
}

/**
 * Batch helper — resolves several travel times in parallel, useful for slot
 * generation (computing in/out for each existing booking on a day).
 */
export async function getTravelTimes(
  pairs: { origin: Coords; dest: Coords }[]
): Promise<number[]> {
  return Promise.all(pairs.map((p) => getTravelTime(p.origin, p.dest)));
}
