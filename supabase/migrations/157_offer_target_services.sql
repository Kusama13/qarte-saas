-- Migration 157 — promo offers ciblées par prestation + montant économisé snapshoté
--
-- Contexte :
-- Mig 153 a introduit `merchant_offers.discount_percent` qui s'applique à TOUTE
-- la résa. Une merchant a demandé à pouvoir cibler la promo sur 1-N prestations
-- précises (ex : "-20% Coloration" mais pas sur les coupes).
--
-- Cette migration ajoute :
-- 1. `merchant_offers.target_service_ids UUID[] NULL` — NULL/vide = applicable
--    à toute la résa (legacy, comportement actuel inchangé). Rempli = la promo
--    ne s'applique qu'aux services listés.
-- 2. `merchant_planning_slots.applied_offer_amount NUMERIC NULL` — montant €
--    réellement économisé par la promo sur ce slot (snapshot, pour analytics
--    et résilience face aux re-config). Distinct de `applied_offer_percent`
--    qui reste le % nominal de l'offre au moment de la résa.

ALTER TABLE merchant_offers
  ADD COLUMN IF NOT EXISTS target_service_ids UUID[] NULL;

COMMENT ON COLUMN merchant_offers.target_service_ids IS
  'Liste des prestations auxquelles la promo s applique. NULL ou tableau vide = applicable a toute la resa (legacy).';

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS applied_offer_amount NUMERIC(10, 2) NULL
    CHECK (applied_offer_amount IS NULL OR applied_offer_amount >= 0);

COMMENT ON COLUMN merchant_planning_slots.applied_offer_amount IS
  'Montant en euros reellement economise par la promo (snapshot post-calcul, per-line aware si offre ciblee).';
