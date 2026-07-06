-- Migration 181 : délai minimum avant réservation (anti dernière minute)
--
-- Certains merchants ne veulent pas de résa de dernière minute. Ce réglage
-- impose un délai minimum (en heures) entre "maintenant" et le créneau réservé
-- en ligne : une cliente ne peut réserver qu'au-delà de ce délai.
--
-- Miroir de booking_horizon_days (mig 168, borne haute) — ici la borne basse.
-- Défaut 0 = aucun délai (comportement historique) → déploiement à incidence
-- nulle : rien ne change tant qu'un merchant ne règle pas l'option.
--
-- Enforcé côté serveur (helper isSlotBeforeLeadTime dans src/lib/booking-window.ts)
-- sur book / customer-edit / free-slots / free-availability / listing public,
-- et côté vitrine (ProgrammeView + BookingModal). La résa manuelle dashboard
-- n'est PAS bridée (le merchant peut caler un RDV de dernière minute lui-même).

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_min_lead_hours SMALLINT
  NOT NULL DEFAULT 0 CHECK (booking_min_lead_hours IN (0, 24, 48));
