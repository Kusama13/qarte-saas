-- Mig 174 — Adresse cliente persistee sur la fiche customer (mode home_service)
-- ════════════════════════════════════════════════════════════════════════
-- Contexte : jusqu'a present l'adresse cliente etait stockee uniquement sur
-- chaque slot (merchant_planning_slots.customer_address). Consequence : a
-- chaque resa manuelle, le merchant devait retaper l'adresse meme pour un
-- client deja venu chez lui.
--
-- Cette migration ajoute 3 colonnes a `customers` (NULL par defaut, donc zero
-- impact sur les merchants qui n'ont pas active home_service). Les routes
-- /api/planning/{book,manual-booking} + /api/planning PATCH upsertent
-- l'adresse sur le customer uniquement si merchant.home_service_enabled = true.
--
-- Idempotent (IF NOT EXISTS). Safe a relancer.

-- ─── 1. Colonnes ─────────────────────────────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS address_lat NUMERIC(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS address_lng NUMERIC(10, 7) NULL;

COMMENT ON COLUMN customers.address IS
  'Adresse cliente (mode home_service uniquement). Source: derniere resa avec adresse. NULL si pas applicable ou jamais saisi.';
COMMENT ON COLUMN customers.address_lat IS
  'Latitude geocodee de l adresse cliente (mode home_service). NULL si adresse texte sans geocodage.';
COMMENT ON COLUMN customers.address_lng IS
  'Longitude geocodee de l adresse cliente (mode home_service). NULL si adresse texte sans geocodage.';

-- ─── 2. Backfill depuis le slot le plus recent ─────────────────────────
-- Pour chaque customer ayant deja reserve avec adresse, prendre l'adresse
-- du slot le plus recent (resas futures > passees, et heure recente en cas
-- d'egalite de date). Limite aux customers sans adresse deja set.
UPDATE customers c
SET
  address = sub.customer_address,
  address_lat = sub.customer_lat,
  address_lng = sub.customer_lng
FROM (
  SELECT DISTINCT ON (customer_id)
    customer_id,
    customer_address,
    customer_lat,
    customer_lng
  FROM merchant_planning_slots
  WHERE customer_id IS NOT NULL
    AND customer_address IS NOT NULL
  ORDER BY customer_id, slot_date DESC, start_time DESC
) sub
WHERE c.id = sub.customer_id
  AND c.address IS NULL;
