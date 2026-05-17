// Combien de jours à l'avance la vitrine accepte les réservations.
// Réglable par le merchant (mig 168) : 30 / 60 / 90 jours, défaut 90.
// Cap commun aux 2 modes (slots + libre) — voir api/planning/route.ts (cap public),
// p/[slug]/page.tsx (fetch SSR), p/[slug]/BookingModal.tsx (calendrier client)
// et api/planning/book/route.ts (garde serveur anti-spoof).
// Aligné avec messages.fr.json planning.autoBookingHint ({days} placeholder).

/** Valeur par défaut — utilisée tant que le merchant n'a rien réglé. */
export const BOOKING_HORIZON_DAYS = 90;

/** Choix proposés au merchant dans les paramètres planning. */
export const BOOKING_HORIZON_OPTIONS = [30, 60, 90] as const;

export type BookingHorizonDays = (typeof BOOKING_HORIZON_OPTIONS)[number];

/**
 * Coerce une valeur DB (potentiellement NULL/undefined/legacy) vers un horizon
 * valide. Source unique pour les 4 consommateurs — fallback 90 si invalide.
 */
export function normalizeBookingHorizon(value: unknown): BookingHorizonDays {
  return (BOOKING_HORIZON_OPTIONS as readonly number[]).includes(value as number)
    ? (value as BookingHorizonDays)
    : BOOKING_HORIZON_DAYS;
}
