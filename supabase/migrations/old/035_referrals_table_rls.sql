-- 035: Referral system — ensure table exists, add RLS policies, add missing columns
-- This migration is idempotent (safe to run multiple times)

-- ============================================
-- 1. Add referral columns to merchants (IF NOT EXISTS)
-- ============================================
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referral_program_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referral_reward_referrer TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referral_reward_referred TEXT;

-- ============================================
-- 2. Add referral_code to loyalty_cards (IF NOT EXISTS)
-- ============================================
ALTER TABLE loyalty_cards ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10);

-- ============================================
-- 3. Create referrals table (IF NOT EXISTS)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referrer_card_id UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  referred_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_card_id UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  referred_voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  referrer_voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_referrals_merchant ON referrals(merchant_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_voucher ON referrals(referred_voucher_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- 5. Enable RLS
-- ============================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies (wrapped in DO blocks to handle duplicates)
-- ============================================

-- Merchants can view referrals for their shop (dashboard)
DO $$ BEGIN
  CREATE POLICY "Merchants can view their referrals"
    ON referrals FOR SELECT
    USING (
      merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role full access (for API routes using supabaseAdmin)
DO $$ BEGIN
  CREATE POLICY "Service role access referrals"
    ON referrals FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public can insert referrals (via referral signup flow)
DO $$ BEGIN
  CREATE POLICY "Public can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
