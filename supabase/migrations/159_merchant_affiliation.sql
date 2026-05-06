-- Mig 159 — affiliation merchant->merchant
-- Tracker quel merchant a parraine quel autre merchant via lien ?ref=<slug>
-- Visu admin dans /admin/affiliations.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS referred_by_merchant_id UUID NULL
    REFERENCES merchants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_merchants_referred_by
  ON merchants(referred_by_merchant_id)
  WHERE referred_by_merchant_id IS NOT NULL;

COMMENT ON COLUMN merchants.referred_by_merchant_id IS
  'Merchant parrain (lien ?ref=<slug> au signup). NULL si signup organique.';
