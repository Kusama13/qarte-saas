-- Mig 165 — Toggle "acompte uniquement pour les nouvelles clientes"
--
-- Permet au merchant de demander un acompte SEULEMENT aux clientes qu'il
-- ne connait pas encore (= absence du profil `customers` pour ce
-- merchant_id). Les clientes connues passent direct sans acompte. Inclut
-- les walk-ins ajoutes manuellement via ClientSelectModal (le merchant
-- les a vues physiquement, leur fait confiance). Coexiste avec
-- member_programs.skip_deposit (gate par programme membre) qui reste
-- prioritaire. Meme semantique "is new" que la welcome offer.
--
-- Defense-in-depth : check applique cote serveur dans /api/planning/book
-- (le seul flow qui demande un acompte ; manual-booking n'a jamais eu
-- d'acompte). UI cliente cache le bloc deposit quand recognition.kind='known'.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS deposit_only_for_new_customers BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN merchants.deposit_only_for_new_customers IS
  'Mig 165. Si TRUE et que le profil customers existe deja pour ce merchant_id, skip l''acompte au booking en ligne.';
