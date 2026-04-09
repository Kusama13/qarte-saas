-- Migration 105: Jeu concours mensuel
-- Merchants can enable a monthly contest where clients who book are automatically entered

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS contest_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contest_prize TEXT;

CREATE TABLE IF NOT EXISTS merchant_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  contest_month VARCHAR(7) NOT NULL,
  prize_description TEXT NOT NULL,
  winner_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  winner_name TEXT,
  winner_phone TEXT,
  participants_count INTEGER NOT NULL DEFAULT 0,
  drawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, contest_month)
);

CREATE INDEX IF NOT EXISTS idx_merchant_contests_merchant ON merchant_contests(merchant_id, contest_month DESC);

ALTER TABLE merchant_contests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Merchants read own contests' AND tablename = 'merchant_contests') THEN
    CREATE POLICY "Merchants read own contests" ON merchant_contests FOR SELECT
      USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access contests' AND tablename = 'merchant_contests') THEN
    CREATE POLICY "Service role full access contests" ON merchant_contests FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
