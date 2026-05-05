-- 156 — Validation manuelle de vouchers (audit log)
--
-- Ajoute 2 colonnes pour tracer les vouchers marqués utilisés manuellement
-- depuis le dashboard merchant (vs scan client habituel via /api/vouchers/use).
--
-- Cas d'usage v1 : page /dashboard/referrals — bouton "Valider côté filleul" /
-- "Valider côté parrain" quand le merchant a oublié de scanner le voucher en
-- boutique. Réutilisable plus tard pour gift_cards / birthday vouchers.
--
-- Conventions :
--   - manual_validation_reason NULL  = voucher utilisé via scan client (flow normal)
--   - manual_validation_reason 'xxx' = voucher utilisé manuellement par le merchant,
--     'xxx' est la raison saisie obligatoirement dans la modale (>=3 chars)
--   - manually_validated_by  = merchant.id qui a déclenché la validation manuelle
--     (FK ON DELETE SET NULL pour préserver l'audit si le merchant disparaît)

ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS manual_validation_reason TEXT NULL
    CHECK (manual_validation_reason IS NULL OR length(manual_validation_reason) >= 3),
  ADD COLUMN IF NOT EXISTS manually_validated_by UUID NULL
    REFERENCES merchants(id) ON DELETE SET NULL;

COMMENT ON COLUMN vouchers.manual_validation_reason IS
  'Raison saisie par le merchant lors d''une validation manuelle (NULL = scan client classique). Source : modale /dashboard/referrals (parrainage v1).';

COMMENT ON COLUMN vouchers.manually_validated_by IS
  'Merchant qui a marqué ce voucher utilisé manuellement (NULL = scan client). Audit trail.';
