-- 124_slot_attendance_status.sql
-- Ajoute attendance_status sur merchant_planning_slots pour le tracking
-- des no-shows et annulations à des fins de statistiques merchant.
--
-- États :
--   pending   — RDV à venir ou passé mais non marqué (default pour les nouveaux slots pris)
--   attended  — cliente venue
--   no_show   — la cliente ne s'est pas présentée (lapin)
--   cancelled — RDV annulé (futur : pas encore utilisé v1)
--
-- Le marquage se fait manuellement par le merchant depuis BookingDetailsModal
-- sur les slots passés (boutons « Cliente venue » / « Ne s'est pas présentée »).

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(12)
  CHECK (attendance_status IN ('pending', 'attended', 'no_show', 'cancelled'));

-- Index partiel pour les queries stats qui ne regardent que les slots marqués
-- (évite le cost d'un index full sur tous les slots futurs).
CREATE INDEX IF NOT EXISTS idx_planning_slots_attendance
  ON merchant_planning_slots(merchant_id, attendance_status, slot_date)
  WHERE attendance_status IS NOT NULL;

-- Backfill best-effort : les slots passés (date < today) qui ont un client_name
-- sont présumés « attended » (historiquement, on n'enregistre le slot que si
-- la cliente a pris RDV ; la distinction no-show n'existait pas).
-- Ce backfill évite un taux no-show à 0% sur le premier mois.
UPDATE merchant_planning_slots
SET attendance_status = 'attended'
WHERE attendance_status IS NULL
  AND client_name IS NOT NULL
  AND client_name <> '__blocked__'
  AND slot_date < CURRENT_DATE;
