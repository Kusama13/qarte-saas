-- ============================================
-- MIGRATION: Add missing DELETE policies
-- Run this migration in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VISITS - Add DELETE policy for merchants
-- ============================================
CREATE POLICY "Merchants can delete their visits"
  ON visits FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Service role full access for API
CREATE POLICY "Service role access visits"
  ON visits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. POINT_ADJUSTMENTS - Add DELETE policy
-- ============================================
CREATE POLICY "Merchants can delete their point adjustments"
  ON point_adjustments FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Service role full access for API
CREATE POLICY "Service role access point_adjustments"
  ON point_adjustments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. REDEMPTIONS - Add service role policy
-- ============================================
CREATE POLICY "Service role access redemptions"
  ON redemptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Merchants can delete their redemptions
CREATE POLICY "Merchants can delete their redemptions"
  ON redemptions FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- ============================================
-- 4. LOYALTY_CARDS - Add DELETE policy
-- ============================================
CREATE POLICY "Merchants can delete their loyalty cards"
  ON loyalty_cards FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Service role full access for API
CREATE POLICY "Service role access loyalty_cards"
  ON loyalty_cards FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. CUSTOMERS - Add service role policy
-- (No DELETE for users, only via service_role)
-- ============================================
CREATE POLICY "Service role access customers"
  ON customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Merchants can delete their visits" ON visits IS 'Allow merchants to delete visit records for their shop';
COMMENT ON POLICY "Merchants can delete their point adjustments" ON point_adjustments IS 'Allow merchants to delete adjustment records for their shop';
COMMENT ON POLICY "Merchants can delete their loyalty cards" ON loyalty_cards IS 'Allow merchants to delete loyalty cards for their shop';
