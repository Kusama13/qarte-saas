-- Migration 056: Welcome Offer (offre de bienvenue)
-- Permet aux merchants de configurer une offre pour les nouveaux clients
-- via la page publique /p/[slug]. Parrain virtuel = Qarte.

-- 1. Colonnes merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS welcome_offer_enabled boolean DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS welcome_offer_description text DEFAULT NULL;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS welcome_referral_code text DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_welcome_code
  ON merchants(welcome_referral_code) WHERE welcome_referral_code IS NOT NULL;

-- 2. Elargir CHECK source vouchers (ajouter 'welcome')
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_source_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_source_check
  CHECK (source IN ('birthday', 'referral', 'redemption', 'welcome'));

-- 3. Rendre referrer nullable dans referrals (pour welcome = parrain Qarte)
ALTER TABLE referrals ALTER COLUMN referrer_customer_id DROP NOT NULL;
ALTER TABLE referrals ALTER COLUMN referrer_card_id DROP NOT NULL;
