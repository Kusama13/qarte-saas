// Pure-math geo helpers, safe to import from both server and client.
// (travel-time.ts est server-only — il importe supabaseAdmin.)

export interface LatLng {
  lat: number;
  lng: number;
}

/** Distance à vol d'oiseau en km (Haversine, rayon Terre 6371 km). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
