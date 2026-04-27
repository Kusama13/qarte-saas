-- Migration 131 : Persistence de la prestation sur mesure dans booking_deposit_failures.
--
-- Quand un booking avec une prestation sur mesure rate son acompte, la cron
-- releaseExpiredDeposits archive le slot dans booking_deposit_failures avant
-- de le wiper. Sans ces colonnes, la prestation custom etait perdue au moment
-- du bring-back.
--
-- Cf. migration 130 pour la version sur merchant_planning_slots.

ALTER TABLE booking_deposit_failures
  ADD COLUMN IF NOT EXISTS custom_service_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_service_duration INTEGER,
  ADD COLUMN IF NOT EXISTS custom_service_price INTEGER,
  ADD COLUMN IF NOT EXISTS custom_service_color TEXT;

ALTER TABLE booking_deposit_failures
  ADD CONSTRAINT booking_deposit_failures_custom_duration_positive
    CHECK (custom_service_duration IS NULL OR custom_service_duration > 0),
  ADD CONSTRAINT booking_deposit_failures_custom_price_positive
    CHECK (custom_service_price IS NULL OR custom_service_price >= 0);
