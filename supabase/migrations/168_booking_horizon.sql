-- Migration 168 — horizon de réservation configurable par le merchant
--
-- Jusqu'ici l'horizon (combien de jours à l'avance une cliente peut réserver)
-- était une constante code partagée 90j. Des merchants ont demandé à pouvoir
-- le réduire (agenda court terme, dispos qui bougent souvent).
--
-- Réglage : 30 / 60 / 90 jours. Défaut 90 (= comportement actuel, rétrocompat
-- totale). S'applique aux 2 modes (créneaux + libre).
--
-- Colonne additive NOT NULL avec DEFAULT — aucun backfill nécessaire.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS booking_horizon_days SMALLINT NOT NULL DEFAULT 90
    CHECK (booking_horizon_days IN (30, 60, 90));
