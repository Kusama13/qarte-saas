-- Mig 166 — billing_interval accepte la valeur 'semestrial' (plan 6 mois)
--
-- Le plan 6 mois (Tout-en-un 120€ / Fidélité 95€) remplace l'annuel pour les
-- nouveaux merchants en testing. Les abonnés annuels existants gardent leur
-- valeur 'annual' inchangée — pas de backfill.
--
-- La colonne `billing_interval` (mig 051) est un TEXT sans CHECK constraint
-- aujourd'hui, donc strictement parlant aucune migration n'est nécessaire pour
-- accepter une nouvelle valeur. On ajoute quand même un CHECK explicite pour
-- documenter les valeurs autorisées et bloquer les fautes de frappe futures.

ALTER TABLE merchants
  DROP CONSTRAINT IF EXISTS merchants_billing_interval_check;

ALTER TABLE merchants
  ADD CONSTRAINT merchants_billing_interval_check
  CHECK (billing_interval IN ('monthly', 'annual', 'semestrial'));

COMMENT ON COLUMN merchants.billing_interval IS
  'Cycle facturation Stripe : monthly (24€/19€), semestrial (120€/95€ — engagement 6 mois), annual (240€/190€ — legacy, plus proposé aux nouveaux merchants depuis mai 2026).';
