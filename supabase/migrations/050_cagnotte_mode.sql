-- 050: Mode Cagnotte (cashback) + purge mode article (code mort)
-- Nouveau mode fidélité : le merchant saisit le montant dépensé par visite,
-- la récompense au palier = un pourcentage du montant cumulé.

-- 1. Purger le mode article (jamais utilisé) + autoriser 'cagnotte'
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_loyalty_mode_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_loyalty_mode_check
  CHECK (loyalty_mode IN ('visit', 'cagnotte'));
ALTER TABLE merchants DROP COLUMN IF EXISTS product_name;
ALTER TABLE merchants DROP COLUMN IF EXISTS max_quantity_per_scan;

-- 2. Pourcentages de récompense cagnotte sur merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS cagnotte_percent NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cagnotte_tier2_percent NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN merchants.cagnotte_percent IS 'Tier 1 reward percentage for cagnotte mode';
COMMENT ON COLUMN merchants.cagnotte_tier2_percent IS 'Tier 2 reward percentage for cagnotte mode';

-- 3. Montant cumulé sur la carte fidélité
ALTER TABLE loyalty_cards
  ADD COLUMN IF NOT EXISTS current_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN loyalty_cards.current_amount IS 'Accumulated spending in EUR for cagnotte mode';

-- 4. Montant dépensé par visite
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS amount_spent NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN visits.amount_spent IS 'Amount spent (EUR) for this visit in cagnotte mode';

-- 5. Audit trail récompenses cagnotte
ALTER TABLE redemptions
  ADD COLUMN IF NOT EXISTS amount_accumulated NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reward_percent NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reward_value NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN redemptions.amount_accumulated IS 'Total amount accumulated at time of redemption (cagnotte)';
COMMENT ON COLUMN redemptions.reward_percent IS 'Percentage applied for the reward (cagnotte)';
COMMENT ON COLUMN redemptions.reward_value IS 'Calculated reward value in EUR (cagnotte)';
