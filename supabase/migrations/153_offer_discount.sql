-- Migration 153 — discount % sur offres promo + welcome + tracking sur slots
--
-- Contexte :
-- - merchant_offers (mig 060) ne stockait que titre/description/expires_at →
--   bandeau marketing pur, aucune réduction calculée sur la vitrine
-- - welcome offer (merchants.welcome_offer_enabled, mig 056) créait un voucher
--   post-résa au lieu d'appliquer une réduction immédiate
--
-- Cette migration ajoute :
-- 1. discount_percent (NULL accepté = grandfathered descriptif) sur merchant_offers
-- 2. welcome_offer_discount_percent (NULL = legacy voucher mode) sur merchants
-- 3. Snapshots applied_* sur merchant_planning_slots pour historique fidèle
--    même si l'offre est désactivée ou que le merchant change le %

-- 1. Promo offer : % optionnel
ALTER TABLE merchant_offers
  ADD COLUMN IF NOT EXISTS discount_percent SMALLINT NULL
    CHECK (discount_percent IS NULL OR (discount_percent BETWEEN 1 AND 100));

-- 2. Welcome offer : % optionnel sur merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS welcome_offer_discount_percent SMALLINT NULL
    CHECK (welcome_offer_discount_percent IS NULL OR (welcome_offer_discount_percent BETWEEN 1 AND 100));

-- 3. Tracking sur slots : snapshots des % appliqués au moment du RDV
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS applied_offer_id UUID NULL
    REFERENCES merchant_offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applied_offer_percent SMALLINT NULL
    CHECK (applied_offer_percent IS NULL OR (applied_offer_percent BETWEEN 1 AND 100)),
  ADD COLUMN IF NOT EXISTS applied_welcome_percent SMALLINT NULL
    CHECK (applied_welcome_percent IS NULL OR (applied_welcome_percent BETWEEN 1 AND 100));

-- Cohérence : si applied_offer_id présent, applied_offer_percent doit l'être aussi
ALTER TABLE merchant_planning_slots
  ADD CONSTRAINT applied_offer_consistency
    CHECK (
      (applied_offer_id IS NULL AND applied_offer_percent IS NULL)
      OR (applied_offer_id IS NOT NULL AND applied_offer_percent IS NOT NULL)
    );
