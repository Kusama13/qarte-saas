// Combien de jours à l'avance la vitrine accepte les réservations.
// Réglable par le merchant (mig 168) : 30 / 60 / 90 jours, défaut 90.
// Cap commun aux 2 modes (slots + libre) — voir api/planning/route.ts (cap public),
// p/[slug]/page.tsx (fetch SSR), p/[slug]/BookingModal.tsx (calendrier client)
// et api/planning/book/route.ts (garde serveur anti-spoof).
// Aligné avec messages.fr.json planning.autoBookingHint ({days} placeholder).

import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { getTimezoneForCountry } from './utils';

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

// ─────────────────────────────────────────────────────────────────────────────
// Past-slot guard (source unique vitrine + APIs)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renvoie true si le créneau (date + heure dans le fuseau du merchant) est
 * déjà passé par rapport à NOW(). Sémantique stricte `<` : un slot dont l'heure
 * EST exactement maintenant est encore acceptable (la cliente clique pile à
 * 14:00:00 sur un slot 14:00 → on accepte). On rejette uniquement le passé
 * franc. Aligne avec le filtre UI à granularité minute (`start_time >= nowMins`).
 *
 * Utilisé par :
 * - `/api/planning/book` (POST cliente)
 * - `/api/planning/customer-edit` PATCH (reschedule cliente)
 * - `/api/planning/free-slots` et `/api/planning?public=true` (filtres dispos)
 * - `ProgrammeView` / `BookingModal` (filtres UI vitrine)
 */
export function isSlotInPast(
  slotDate: string,
  slotTime: string,
  country?: string,
  now: Date = new Date(),
): boolean {
  const tz = getTimezoneForCountry(country);
  const slotInstant = fromZonedTime(`${slotDate}T${slotTime}:00`, tz);
  return slotInstant.getTime() < now.getTime();
}

/**
 * Renvoie le nombre de minutes écoulées depuis minuit dans le fuseau merchant.
 * Helper partagé pour le filtre "heure passée aujourd'hui" en UI/API mode libre.
 * Granularité minute (cohérent avec `start_time` au format HH:mm).
 */
export function getMinutesSinceMidnightForCountry(country?: string, now: Date = new Date()): number {
  const tz = getTimezoneForCountry(country);
  const [h, m] = formatInTimeZone(now, tz, 'HH:mm').split(':').map(Number);
  return h * 60 + m;
}
