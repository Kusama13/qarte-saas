-- Migration 182 : photo optionnelle par prestation
--
-- Une prestation peut porter une photo (facultative) affichée en vignette sur la
-- vitrine (agrandissable au clic). Stockée dans le bucket Storage `images` sous
-- `services/<merchant_id>/...` (réutilise l'infra upload existante). Colonne
-- additive nullable → aucune incidence sur les prestations existantes.

ALTER TABLE merchant_services ADD COLUMN IF NOT EXISTS image_url TEXT NULL;
