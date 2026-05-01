-- Migration 048: Double stamp days
-- Merchants can configure specific days of the week where each scan counts double

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS double_days_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS double_days_of_week TEXT NOT NULL DEFAULT '[]';

COMMENT ON COLUMN merchants.double_days_enabled IS 'Enable double stamps on specific days of week';
COMMENT ON COLUMN merchants.double_days_of_week IS 'JSON array of JS getDay() values (0=Sun,1=Mon,...,6=Sat)';
