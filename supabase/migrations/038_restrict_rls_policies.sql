-- ============================================
-- MIGRATION 038: Restrict overly-permissive RLS policies
-- Fixes C1 + C11 from security audit
--
-- Problem: 7 tables had FOR ALL USING (true) or per-op USING (true) policies
-- that allow anyone with the anon key to read/write all data.
--
-- Fix: Drop public anon policies. Keep merchant-owner policies (auth.uid()).
-- Add merchant-owner INSERT/UPDATE where missing. Add super_admin SELECT
-- for admin dashboard pages. Add service_role where missing.
--
-- API routes use service_role (supabaseAdmin) so they are NOT affected.
-- Dashboard pages use anon key with auth — they rely on auth.uid() policies.
-- ============================================

-- ============================================
-- 1. CUSTOMERS — Remove public access, add merchant-owner + admin policies
-- ============================================

-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Anyone can create customers" ON customers;
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Anyone can update customers" ON customers;

-- Merchant owner can view their customers
CREATE POLICY "Merchants can view their customers"
  ON customers FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Merchant owner can create customers for their shop
CREATE POLICY "Merchants can insert their customers"
  ON customers FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Merchant owner can update their customers
CREATE POLICY "Merchants can update their customers"
  ON customers FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Super admins can view all customers (admin dashboard)
CREATE POLICY "Super admins can view all customers"
  ON customers FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

-- ============================================
-- 2. LOYALTY_CARDS — Remove public FOR ALL, add merchant-owner INSERT/UPDATE + admin
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view and create loyalty cards" ON loyalty_cards;

-- Merchant owner can insert loyalty cards for their shop
CREATE POLICY "Merchants can insert their loyalty cards"
  ON loyalty_cards FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Merchant owner can update their loyalty cards
CREATE POLICY "Merchants can update their loyalty cards"
  ON loyalty_cards FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Super admins can view all loyalty cards (admin dashboard)
CREATE POLICY "Super admins can view all loyalty cards"
  ON loyalty_cards FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

-- ============================================
-- 3. VISITS — Remove public SELECT/INSERT, add admin
-- ============================================

-- Drop public policies
DROP POLICY IF EXISTS "Public can create visits" ON visits;
DROP POLICY IF EXISTS "Public can view visits" ON visits;

-- Super admins can view all visits (admin dashboard)
CREATE POLICY "Super admins can view all visits"
  ON visits FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

-- ============================================
-- 4. REDEMPTIONS — Remove public FOR ALL, add admin
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can create and view redemptions" ON redemptions;

-- Super admins can view all redemptions (admin dashboard)
CREATE POLICY "Super admins can view all redemptions"
  ON redemptions FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

-- ============================================
-- 5. PUSH_SUBSCRIPTIONS — Remove all public policies, add service_role
-- All access goes through API routes (service_role).
-- ============================================

DROP POLICY IF EXISTS "Anyone can create push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Anyone can view push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Anyone can update push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete push subscriptions" ON push_subscriptions;

-- Service role full access (was missing!)
CREATE POLICY "Service role access push_subscriptions"
  ON push_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. VOUCHERS — Remove public INSERT/UPDATE/SELECT (keep merchant-owner SELECT)
-- All writes go through API routes (service_role).
-- ============================================

DROP POLICY IF EXISTS "Public can view vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public can create vouchers" ON vouchers;
DROP POLICY IF EXISTS "Public can update vouchers" ON vouchers;

-- ============================================
-- 7. MEMBER_CARDS — Remove public SELECT/INSERT
-- All access goes through API routes (service_role).
-- ============================================

DROP POLICY IF EXISTS "Anyone can view member cards" ON member_cards;
DROP POLICY IF EXISTS "Anyone can create member cards" ON member_cards;

-- Merchant owner can view member cards for their programs
CREATE POLICY "Merchants can view their member cards"
  ON member_cards FOR SELECT
  USING (
    program_id IN (
      SELECT id FROM member_programs
      WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- 8. REFERRALS — Remove public INSERT (already service_role + merchant SELECT)
-- All writes go through API routes (service_role).
-- ============================================

DROP POLICY IF EXISTS "Public can create referrals" ON referrals;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Merchants can view their customers" ON customers IS 'Merchant owner can view customers for their shop';
COMMENT ON POLICY "Merchants can insert their customers" ON customers IS 'Merchant owner can create customers for their shop';
COMMENT ON POLICY "Merchants can update their customers" ON customers IS 'Merchant owner can update customers for their shop';
COMMENT ON POLICY "Super admins can view all customers" ON customers IS 'Admin dashboard needs cross-merchant customer access';
COMMENT ON POLICY "Merchants can insert their loyalty cards" ON loyalty_cards IS 'Merchant owner can create loyalty cards for their shop';
COMMENT ON POLICY "Merchants can update their loyalty cards" ON loyalty_cards IS 'Merchant owner can update loyalty cards for their shop';
COMMENT ON POLICY "Super admins can view all loyalty cards" ON loyalty_cards IS 'Admin dashboard needs cross-merchant card access';
COMMENT ON POLICY "Super admins can view all visits" ON visits IS 'Admin dashboard needs cross-merchant visit access';
COMMENT ON POLICY "Super admins can view all redemptions" ON redemptions IS 'Admin dashboard needs cross-merchant redemption access';
COMMENT ON POLICY "Service role access push_subscriptions" ON push_subscriptions IS 'Only API routes (service_role) manage push subscriptions';
COMMENT ON POLICY "Merchants can view their member cards" ON member_cards IS 'Merchant owner can view member cards for their programs';
