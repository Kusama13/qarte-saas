-- Trial period 7 days → 3 days (new merchants only)
-- Existing merchants keep their current trial_ends_at value (grandfather)

ALTER TABLE merchants
ALTER COLUMN trial_ends_at
SET DEFAULT (NOW() + INTERVAL '3 days');
