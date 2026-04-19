-- Planning intent column on merchants
-- Allows a merchant to explicitly opt out of the Planning module visibility:
--   'unsure' (default) → checklist shows all 3 groups, emails/banners normal flow
--   'yes'              → user confirmed they want planning (set automatically when they activate it)
--   'no'               → user told us they only want loyalty → hide Planning group in checklist,
--                        skip Planning Reminder email J+4, hide SMS quota paywall on dashboard home
--
-- A 3-state column (vs boolean) lets us distinguish 'never asked' from 'explicitly opted out',
-- which is useful for downstream targeting (emails, surveys).

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS planning_intent TEXT
  CHECK (planning_intent IN ('unsure', 'yes', 'no'))
  DEFAULT 'unsure';

COMMENT ON COLUMN merchants.planning_intent IS
  '3-state intent for Planning module: unsure (default), yes (wants it), no (Fidelity-only — hide planning UI/emails)';
