-- Member Programs and Member Cards tables
-- Allows merchants to create membership programs with benefits

-- ============================================
-- MEMBER PROGRAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS member_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  benefit_label TEXT NOT NULL,
  duration_months NUMERIC(6,2) DEFAULT 12 CHECK (duration_months > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_programs_merchant ON member_programs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_member_programs_active ON member_programs(merchant_id, is_active);

-- ============================================
-- MEMBER CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS member_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES member_programs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One card per customer per program
  UNIQUE(program_id, customer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_cards_program ON member_cards(program_id);
CREATE INDEX IF NOT EXISTS idx_member_cards_customer ON member_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_member_cards_valid ON member_cards(valid_until);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE member_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_cards ENABLE ROW LEVEL SECURITY;

-- Member Programs: Merchants can manage their own programs
CREATE POLICY "Merchants can view their member programs"
  ON member_programs FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Merchants can insert their member programs"
  ON member_programs FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Merchants can update their member programs"
  ON member_programs FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

CREATE POLICY "Merchants can delete their member programs"
  ON member_programs FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

-- Service role full access for API
CREATE POLICY "Service role full access member_programs"
  ON member_programs FOR ALL
  USING (true);

-- Member Cards: Allow public read/create for customer card display
CREATE POLICY "Anyone can view member cards"
  ON member_cards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create member cards"
  ON member_cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role full access member_cards"
  ON member_cards FOR ALL
  USING (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE member_programs IS 'Membership programs created by merchants';
COMMENT ON COLUMN member_programs.name IS 'Program name (e.g., "Carte VIP", "Abonnement Premium")';
COMMENT ON COLUMN member_programs.benefit_label IS 'Benefit description (e.g., "-10% sur tous les achats")';
COMMENT ON COLUMN member_programs.duration_months IS 'Program duration in months (can be decimal for days/weeks)';

COMMENT ON TABLE member_cards IS 'Customer membership cards linked to programs';
COMMENT ON COLUMN member_cards.valid_from IS 'Start date of membership';
COMMENT ON COLUMN member_cards.valid_until IS 'Expiration date of membership';
