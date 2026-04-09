-- ── 103_planning_free_mode.sql ──────────────────────────────────────────
-- Adds booking_mode + buffer_minutes on merchants,
-- adds total_duration_minutes on merchant_planning_slots,
-- and drops the merchant_planning_hours table if it was created previously
-- (opening hours for mode libre reuse merchant.opening_hours instead).

-- 1. New columns on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS booking_mode VARCHAR(10) NOT NULL DEFAULT 'slots'
    CHECK (booking_mode IN ('slots', 'free')),
  ADD COLUMN IF NOT EXISTS buffer_minutes SMALLINT NOT NULL DEFAULT 0
    CHECK (buffer_minutes IN (0, 10, 15, 30));

-- 2. total_duration_minutes on merchant_planning_slots
--    NULL = mode créneaux (duration implicit from linked services)
--    Non-null = mode libre (single slot per booking, no filler slots)
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS total_duration_minutes SMALLINT NULL;

-- 3. Drop merchant_planning_hours if it was created in a previous run
--    (superseded by merchant.opening_hours JSON field)
DROP TABLE IF EXISTS merchant_planning_hours;
