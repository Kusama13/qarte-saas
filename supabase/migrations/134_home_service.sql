-- Migration 134 — Mode "service à domicile" + cache durée de trajet
--
-- Contexte : pour les marchandes qui interviennent à domicile (ongleries
-- mobiles, esthéticiennes itinérantes), il faut intégrer le temps de trajet
-- entre RDV dans le calcul des disponibilités. La cliente saisit son adresse
-- lors de la réservation, et on calcule la durée de trajet :
--   - depuis l'adresse du marchand pour le 1er RDV de la journée
--   - depuis l'adresse de la cliente précédente pour les suivants
--
-- S'applique uniquement au mode libre (booking_mode = 'free').

-- 1) Toggle + coords du marchand
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS home_service_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shop_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS shop_lng DOUBLE PRECISION;

-- 2) Adresse + coords cliente sur chaque slot, durée de trajet calculée
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS customer_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS travel_time_minutes SMALLINT,
  ADD COLUMN IF NOT EXISTS travel_time_overridden BOOLEAN NOT NULL DEFAULT FALSE;

-- 3) Cache des durées de trajet pour éviter de spammer OpenRouteService.
--    Clé = "lat,lng" arrondi 4 décimales (~11m de précision).
CREATE TABLE IF NOT EXISTS travel_time_cache (
  origin_key TEXT NOT NULL,
  dest_key TEXT NOT NULL,
  duration_minutes SMALLINT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (origin_key, dest_key)
);

CREATE INDEX IF NOT EXISTS idx_travel_time_cache_fetched_at
  ON travel_time_cache (fetched_at);

-- RLS : table server-only (lue/écrite via supabaseAdmin dans src/lib/travel-time.ts).
-- On active RLS sans policies → seul service_role peut accéder (défense en profondeur :
-- si jamais l'anon key touche cette table, tout est bloqué).
ALTER TABLE travel_time_cache ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE travel_time_cache IS
  'Cache durées trajet OpenRouteService. Purger entrées > 6 mois via cron.';
