-- Migration 179 : archivage (soft-delete) des prestations
--
-- Supprimer une prestation utilisée par des RDV faisait un hard delete : le lien
-- planning_slot_services (ON DELETE CASCADE) disparaissait et la résa perdait le
-- nom de la prestation. On ajoute un archived_at : "Supprimer" archive la presta
-- quand elle est référencée par des RDV (retirée de la vitrine + sélection, mais
-- la ligne reste → la jointure résout toujours le nom), et hard delete sinon.

ALTER TABLE merchant_services ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

-- Listings actifs (vitrine, sélection, dashboard) : scan rapide des non-archivées.
CREATE INDEX IF NOT EXISTS idx_merchant_services_active
  ON merchant_services(merchant_id) WHERE archived_at IS NULL;

-- Le DELETE prestation compte les RDV legacy qui la référencent (colonne directe
-- merchant_planning_slots.service_id) pour décider archive vs hard delete : évite un
-- seq scan des créneaux du merchant. (Le lien junction planning_slot_services.service_id
-- est déjà indexé par idx_planning_slot_services_service, mig 071.)
CREATE INDEX IF NOT EXISTS idx_planning_slots_service
  ON merchant_planning_slots(service_id) WHERE service_id IS NOT NULL;
