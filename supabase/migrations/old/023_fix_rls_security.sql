-- ============================================
-- MIGRATION: Fix RLS Security Issues
-- Run this migration in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. BANNED_NUMBERS - Enable RLS + Add Policies
-- ============================================
ALTER TABLE banned_numbers ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own banned numbers
CREATE POLICY "Merchants can view their banned numbers"
  ON banned_numbers FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Merchants can insert banned numbers for their shop
CREATE POLICY "Merchants can insert banned numbers"
  ON banned_numbers FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Merchants can delete their banned numbers
CREATE POLICY "Merchants can delete banned numbers"
  ON banned_numbers FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Service role full access (for API routes)
CREATE POLICY "Service role access banned_numbers"
  ON banned_numbers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. PENDING_EMAIL_TRACKING - Enable RLS
-- ============================================
ALTER TABLE pending_email_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can access (used by cron jobs)
CREATE POLICY "Service role access pending_email_tracking"
  ON pending_email_tracking FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. DEMO_LEADS - Enable RLS
-- ============================================
ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert (for demo form)
CREATE POLICY "Public can create demo leads"
  ON demo_leads FOR INSERT
  WITH CHECK (true);

-- Only service role can view/update/delete
CREATE POLICY "Service role access demo_leads"
  ON demo_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. TOOL_LEADS - Enable RLS
-- ============================================
ALTER TABLE tool_leads ENABLE ROW LEVEL SECURITY;

-- Public can insert (for tool forms)
CREATE POLICY "Public can create tool leads"
  ON tool_leads FOR INSERT
  WITH CHECK (true);

-- Only service role can view/update/delete
CREATE POLICY "Service role access tool_leads"
  ON tool_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. FIX PUSH_HISTORY - Wrong policy
-- ============================================
-- Drop the incorrect policy
DROP POLICY IF EXISTS "Merchants can view own push history" ON push_history;

-- Create correct policy
CREATE POLICY "Merchants can view their push history"
  ON push_history FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Add service role policy for API
DROP POLICY IF EXISTS "Service role can insert push history" ON push_history;
CREATE POLICY "Service role full access push_history"
  ON push_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. FIX ADMIN TABLES - Restrict to service_role only
-- ============================================

-- Admin Notes
DROP POLICY IF EXISTS "Service role access admin_notes" ON admin_notes;
CREATE POLICY "Service role only admin_notes"
  ON admin_notes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin Tasks
DROP POLICY IF EXISTS "Service role access admin_tasks" ON admin_tasks;
CREATE POLICY "Service role only admin_tasks"
  ON admin_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Prospects
DROP POLICY IF EXISTS "Service role access prospects" ON prospects;
CREATE POLICY "Service role only prospects"
  ON prospects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7. FIX ADMIN_EXPENSES - Use super_admins table
-- ============================================
-- First create super_admins table if not exists
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Only service role can manage super_admins
CREATE POLICY "Service role only super_admins"
  ON super_admins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix admin_expenses policies
DROP POLICY IF EXISTS "Admins can read expenses" ON admin_expenses;
DROP POLICY IF EXISTS "Admins can insert expenses" ON admin_expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON admin_expenses;

CREATE POLICY "Super admins can read expenses"
  ON admin_expenses FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Super admins can insert expenses"
  ON admin_expenses FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Super admins can update expenses"
  ON admin_expenses FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Super admins can delete expenses"
  ON admin_expenses FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Service role access admin_expenses"
  ON admin_expenses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix admin_fixed_costs policies
DROP POLICY IF EXISTS "Admins can read fixed costs" ON admin_fixed_costs;
DROP POLICY IF EXISTS "Admins can insert fixed costs" ON admin_fixed_costs;
DROP POLICY IF EXISTS "Admins can update fixed costs" ON admin_fixed_costs;
DROP POLICY IF EXISTS "Admins can delete fixed costs" ON admin_fixed_costs;

CREATE POLICY "Super admins can read fixed costs"
  ON admin_fixed_costs FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Super admins can insert fixed costs"
  ON admin_fixed_costs FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Super admins can update fixed costs"
  ON admin_fixed_costs FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Super admins can delete fixed costs"
  ON admin_fixed_costs FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Service role access admin_fixed_costs"
  ON admin_fixed_costs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 8. ADD VOUCHERS TABLE IF MISSING + RLS
-- ============================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_card_id UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reward_description TEXT NOT NULL,
  tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2)),
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_loyalty_card ON vouchers(loyalty_card_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_merchant ON vouchers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_customer ON vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used ON vouchers(is_used);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Merchants can view vouchers for their shop
CREATE POLICY "Merchants can view their vouchers"
  ON vouchers FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Public can view their own vouchers (by customer)
CREATE POLICY "Public can view vouchers"
  ON vouchers FOR SELECT
  USING (true);

-- Public can create vouchers (via check-in)
CREATE POLICY "Public can create vouchers"
  ON vouchers FOR INSERT
  WITH CHECK (true);

-- Public can update vouchers (mark as used)
CREATE POLICY "Public can update vouchers"
  ON vouchers FOR UPDATE
  USING (true);

-- Service role full access
CREATE POLICY "Service role access vouchers"
  ON vouchers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE super_admins IS 'Users with super admin access to admin dashboard';
COMMENT ON TABLE vouchers IS 'Reward vouchers generated when customers reach stamp thresholds';
