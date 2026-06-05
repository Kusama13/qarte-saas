/**
 * Mig 174 — Helper pour ecrire l'adresse cliente sur customers (mode home_service).
 * Utilise par /api/planning/{book,manual-booking,route.ts}.
 *
 * Le gate `home_service_enabled` est verifie par l'appelant (merchant deja en
 * main). Ce helper s'occupe uniquement du shape des champs et trim de l'adresse.
 */

export type CustomerAddressFields = {
  address: string;
  address_lat: number | null;
  address_lng: number | null;
};

/**
 * Retourne les 3 champs adresse a inserer ou updater sur customers,
 * ou null si pas d'adresse (no-op cote appelant).
 */
export function customerAddressFields(
  address: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
): CustomerAddressFields | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return {
    address: trimmed,
    address_lat: lat ?? null,
    address_lng: lng ?? null,
  };
}
