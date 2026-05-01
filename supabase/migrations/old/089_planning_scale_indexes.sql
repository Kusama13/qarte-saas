-- Migration 089: Indexes de scalabilite pour merchant_planning_slots
-- Contexte : limite passee de 200 a 500 slots actifs par merchant (2026-04-05)
--
-- Renforce 2 hot paths :
-- 1. Cron deposit deadline (morning-jobs + evening) — partial index sur les deposits en attente
-- 2. Requete "reservations booked" (dashboard onglet Reservations) — partial index filtrant les slots pris
--
-- Note : idx_planning_slots_primary_slot_id existe deja (mig 084).

-- 1. Deposit deadline queries — partial index pour scanner uniquement les deposits en attente non-filler
CREATE INDEX IF NOT EXISTS idx_planning_slots_deposit_deadline
ON merchant_planning_slots (deposit_deadline_at)
WHERE deposit_confirmed = false
  AND deposit_deadline_at IS NOT NULL
  AND primary_slot_id IS NULL;

-- 2. Onglet Reservations dashboard — partial index pour "booked only"
CREATE INDEX IF NOT EXISTS idx_planning_slots_booked
ON merchant_planning_slots (merchant_id, slot_date)
WHERE client_name IS NOT NULL;
