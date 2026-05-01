-- Fix trial period from 14 days to 15 days
-- This aligns with marketing materials and context documentation

ALTER TABLE merchants
ALTER COLUMN trial_ends_at
SET DEFAULT (NOW() + INTERVAL '15 days');

-- Note: This only affects NEW merchants created after this migration.
-- Existing merchants keep their original trial_ends_at value.
