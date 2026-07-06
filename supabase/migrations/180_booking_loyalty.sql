-- Migration 180 : symbiose Réservation → Fidélité ("le point suit la présence")
--
-- Une réservation honorée (attendance_status='attended', manuel ou auto J+1) crédite
-- un point de fidélité (ou le prix de la presta en cagnotte), avec un libellé
-- "Réservation du X" sur la carte. Un no-show ne crédite rien ; un point crédité est
-- retiré si le RDV passe en no_show / est annulé / supprimé.
--
-- Désactivé par défaut (booking_earns_loyalty=false) → déploiement à incidence nulle :
-- rien ne change tant qu'une merchant n'active pas l'option dans Planning > Paramètres.

-- Origine d'un passage : scan en caisse (défaut, comportement historique) ou réservation honorée.
ALTER TABLE visits ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'scan'
  CHECK (source IN ('scan', 'booking'));

-- Lien vers le créneau à l'origine du point (crédit résa). ON DELETE SET NULL : si le
-- créneau est supprimé hors de nos hooks de revoke, le point survit mais orphelin (dégradation
-- acceptable). NULL pour tous les passages issus d'un scan.
ALTER TABLE visits ADD COLUMN IF NOT EXISTS planning_slot_id UUID NULL
  REFERENCES merchant_planning_slots(id) ON DELETE SET NULL;

-- Un créneau ne crédite qu'une fois : garde-fou anti-double / anti-race. Fail-safe — une 2e
-- insertion sur le même créneau échoue (23505), le helper l'ignore (au pire un point manquant,
-- jamais de double ni de corruption, y compris en cas de réutilisation de créneau).
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_planning_slot_unique
  ON visits(planning_slot_id) WHERE planning_slot_id IS NOT NULL;

-- Interrupteur merchant. DEFAULT FALSE = opt-in : au déploiement, aucune résa ne crédite
-- tant que la merchant n'a pas coché l'option.
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_earns_loyalty BOOLEAN NOT NULL DEFAULT FALSE;
