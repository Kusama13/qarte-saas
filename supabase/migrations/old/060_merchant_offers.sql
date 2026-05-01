-- Merchant promotional offers (beyond welcome offer)
CREATE TABLE IF NOT EXISTS merchant_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) <= 100),
  description TEXT NOT NULL CHECK (length(description) <= 500),
  active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  max_claims INTEGER NULL,
  claim_count INTEGER DEFAULT 0,
  offer_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add CHECK constraints if table already existed without them
DO $$ BEGIN
  ALTER TABLE merchant_offers ADD CONSTRAINT merchant_offers_title_length CHECK (length(title) <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE merchant_offers ADD CONSTRAINT merchant_offers_description_length CHECK (length(description) <= 500);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_offers_merchant ON merchant_offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_offers_active ON merchant_offers(merchant_id, active) WHERE active = true;

-- RLS
ALTER TABLE merchant_offers ENABLE ROW LEVEL SECURITY;

-- Policies (drop + recreate to ensure up-to-date)
DROP POLICY IF EXISTS "Public can view active offers" ON merchant_offers;
CREATE POLICY "Public can view active offers"
  ON merchant_offers FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "Merchants manage own offers" ON merchant_offers;
CREATE POLICY "Merchants manage own offers"
  ON merchant_offers FOR ALL
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Add 'offer' to vouchers source CHECK constraint
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_source_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_source_check
  CHECK (source IN ('birthday', 'referral', 'redemption', 'welcome', 'offer'));

-- Add offer_id reference to vouchers (nullable — only for offer vouchers)
DO $$ BEGIN
  ALTER TABLE vouchers ADD COLUMN offer_id UUID NULL REFERENCES merchant_offers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_vouchers_offer ON vouchers(offer_id) WHERE offer_id IS NOT NULL;

-- Prevent duplicate claims (one voucher per customer per offer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_customer_offer_unique
  ON vouchers(customer_id, offer_id) WHERE offer_id IS NOT NULL;

-- Atomic claim_count increment (prevents race condition)
CREATE OR REPLACE FUNCTION increment_offer_claim(p_offer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE merchant_offers
  SET claim_count = claim_count + 1
  WHERE id = p_offer_id
    AND active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_claims IS NULL OR claim_count < max_claims);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
