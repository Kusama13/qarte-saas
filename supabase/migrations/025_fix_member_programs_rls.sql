-- ============================================
-- MIGRATION: Fix member_programs and member_cards RLS policies
-- Run this migration in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX MEMBER_PROGRAMS - Service role policy was incorrectly applied to everyone
-- ============================================

-- Drop the incorrect policy that gives everyone full access
DROP POLICY IF EXISTS "Service role full access member_programs" ON member_programs;

-- Create correct service role policy
CREATE POLICY "Service role access member_programs"
  ON member_programs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add public read policy for customer-facing features
CREATE POLICY "Public can view active member programs"
  ON member_programs FOR SELECT
  USING (is_active = true);

-- ============================================
-- 2. FIX MEMBER_CARDS - Service role policy was incorrectly applied
-- ============================================

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Service role full access member_cards" ON member_cards;

-- Create correct service role policy
CREATE POLICY "Service role access member_cards"
  ON member_cards FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Service role access member_programs" ON member_programs IS 'Allow API routes with service_role to manage all programs';
COMMENT ON POLICY "Public can view active member programs" ON member_programs IS 'Allow public to see active programs for customer-facing features';
COMMENT ON POLICY "Service role access member_cards" ON member_cards IS 'Allow API routes with service_role to manage all cards';
