-- Formalize the manual rename of created_at → adjusted_at on point_adjustments
-- (was done manually in prod but never captured in migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'point_adjustments' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE point_adjustments RENAME COLUMN created_at TO adjusted_at;
  END IF;
END $$;
