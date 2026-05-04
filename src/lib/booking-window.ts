// Combien de jours à l'avance la vitrine accepte les réservations.
// Cap commun aux 2 modes (slots + libre) — voir api/planning/route.ts (cap public),
// p/[slug]/page.tsx (fetch SSR) et p/[slug]/BookingModal.tsx (calendrier client).
// Aligné avec messages.fr.json planning.autoBookingHint ({days} placeholder).
export const BOOKING_HORIZON_DAYS = 90;
