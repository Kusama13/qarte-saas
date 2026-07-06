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
// Délai minimum avant réservation (mig 181) — miroir de l'horizon, borne basse.
// Empêche les résas de dernière minute : une cliente ne peut réserver en ligne
// qu'au-delà de `booking_min_lead_hours` heures. Contrairement à l'horizon (en
// jours), le délai s'exprime en heures et s'étale sur plusieurs jours → on
// raisonne en instants, pas en dates.
// ─────────────────────────────────────────────────────────────────────────────

/** Valeur par défaut — aucun délai, comportement historique. */
export const BOOKING_MIN_LEAD_HOURS = 0;

/** Choix proposés au merchant dans les paramètres planning. */
export const BOOKING_MIN_LEAD_OPTIONS = [0, 24, 48] as const;

export type BookingMinLeadHours = (typeof BOOKING_MIN_LEAD_OPTIONS)[number];

/**
 * Coerce une valeur DB (NULL/undefined/legacy) vers un délai valide. Source
 * unique pour tous les consommateurs — fallback 0 (aucun délai) si invalide.
 */
export function normalizeBookingMinLead(value: unknown): BookingMinLeadHours {
  return (BOOKING_MIN_LEAD_OPTIONS as readonly number[]).includes(value as number)
    ? (value as BookingMinLeadHours)
    : BOOKING_MIN_LEAD_HOURS;
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
 * Renvoie true si le créneau tombe AVANT le seuil `now + leadHours` (délai
 * minimum de réservation, mig 181). Généralisation d'`isSlotInPast` : leadHours
 * = 0 → court-circuit (jamais bloqué), comportement historique. Raisonne en
 * instants → gère nativement un délai qui déborde sur plusieurs jours (48 h).
 * Sémantique stricte `<` (cohérente avec `isSlotInPast`).
 *
 * Appliqué partout où `isSlotInPast` l'est (book, customer-edit reschedule,
 * free-slots, free-availability, listing public, ProgrammeView, BookingModal).
 */
export function isSlotBeforeLeadTime(
  slotDate: string,
  slotTime: string,
  leadHours: number,
  country?: string,
  now: Date = new Date(),
): boolean {
  if (!leadHours) return false;
  const tz = getTimezoneForCountry(country);
  const slotInstant = fromZonedTime(`${slotDate}T${slotTime}:00`, tz);
  return slotInstant.getTime() < now.getTime() + leadHours * 3_600_000;
}

/**
 * Date `YYYY-MM-DD` (fuseau merchant) du seuil de délai minimum : premier jour
 * qui peut contenir un créneau réservable. Sert à borner la borne basse des
 * calendriers vitrine (les jours entièrement dans la fenêtre sont désactivés ;
 * le jour-frontière garde ses créneaux tardifs, filtrés par `isSlotBeforeLeadTime`).
 * leadHours = 0 → aujourd'hui (fuseau merchant).
 */
export function leadCutoffDate(leadHours: number, country?: string, now: Date = new Date()): string {
  const tz = getTimezoneForCountry(country);
  const cutoff = new Date(now.getTime() + (leadHours || 0) * 3_600_000);
  return formatInTimeZone(cutoff, tz, 'yyyy-MM-dd');
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
