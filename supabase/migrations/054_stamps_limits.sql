-- =============================================
-- Migration 054: Enforce stamps limits
-- stamps_required: 1-15 (was 1-50)
-- tier2_stamps_required: max 30 (was no upper bound)
-- =============================================

-- Update stamps_required constraint (1-15)
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_stamps_required_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_stamps_required_check
  CHECK (stamps_required > 0 AND stamps_required <= 15);

-- Update tier2 constraint: must be > stamps_required AND <= 30
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS tier2_stamps_check;
ALTER TABLE merchants ADD CONSTRAINT tier2_stamps_check
  CHECK (
    (tier2_stamps_required IS NULL)
    OR (tier2_stamps_required > stamps_required AND tier2_stamps_required <= 30)
  );
