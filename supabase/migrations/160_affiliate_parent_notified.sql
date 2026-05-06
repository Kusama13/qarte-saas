-- Mig 160 — flag dedup notification parrain quand filleul passe a un plan payant
-- Voir AffiliateConversionEmail + Stripe webhook invoice.payment_succeeded handler

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS affiliate_parent_notified_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN merchants.affiliate_parent_notified_at IS
  'Dedup flag — email envoye au parrain (referred_by_merchant_id) quand ce filleul passe a un plan payant. NULL = pas encore notifie.';

-- DEFENSE EN PROFONDEUR : backfill tous les merchants existants comme "deja notifie"
-- pour eviter spam massif si webhook re-traite des paiements anciens.
UPDATE merchants SET affiliate_parent_notified_at = NOW() WHERE affiliate_parent_notified_at IS NULL;

-- Index partiel sur les filleuls dont le parrain n'est pas encore notifie.
-- Apres backfill, NULL = signups recents avec parrain = ensemble tres petit.
CREATE INDEX IF NOT EXISTS idx_merchants_affiliate_parent_pending
  ON merchants(referred_by_merchant_id)
  WHERE affiliate_parent_notified_at IS NULL AND referred_by_merchant_id IS NOT NULL;
