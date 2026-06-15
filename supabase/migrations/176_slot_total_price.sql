-- Snapshot du prix final réduit d'une réservation (après member + welcome/promo).
-- Source unique de vérité du prix payé : évite que chaque consommateur serveur
-- (emails acompte, stats CA) recalcule depuis le prix catalogue brut et perde les
-- réductions (acompte, "reste à payer" et CA faux pour les résas réduites).
-- La réduction member n'étant pas persistée par % ailleurs, on stocke le montant final.
-- NULL = résa legacy (avant cette migration) → les lectures retombent sur le prix brut.

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) NULL
    CHECK (total_price IS NULL OR total_price >= 0);

COMMENT ON COLUMN merchant_planning_slots.total_price IS
  'Prix final réduit (member + welcome/promo) au moment de la résa. NULL = legacy → fallback prix brut.';
