-- Fix: point_adjustments.adjusted_by FK blocks user deletion
-- Change from RESTRICT (default) to CASCADE
ALTER TABLE point_adjustments
  DROP CONSTRAINT point_adjustments_adjusted_by_fkey,
  ADD CONSTRAINT point_adjustments_adjusted_by_fkey
    FOREIGN KEY (adjusted_by) REFERENCES auth.users(id) ON DELETE CASCADE;
