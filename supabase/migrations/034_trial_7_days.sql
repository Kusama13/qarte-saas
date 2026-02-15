-- Trial period 15 days → 7 days (new merchants only)
-- Grace period reduced from 7 to 3 days (handled in application code)
-- Existing merchants keep their current trial_ends_at value

ALTER TABLE merchants
ALTER COLUMN trial_ends_at
SET DEFAULT (NOW() + INTERVAL '7 days');
