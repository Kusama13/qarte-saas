-- Mig 170 — Rayon d'intervention configurable pour le service à domicile
--
-- Avant : un cap dur de 60 min de trajet (`MAX_TRAVEL_MINUTES`) côté code, non
-- réglable par le merchant. Difficile à expliquer côté cliente (« pas de
-- créneau dispo » sans dire qu'elle est trop loin).
--
-- Maintenant : le merchant peut fixer un rayon en km (5-200, optionnel).
-- - NULL = pas de limite définie → fallback sur le cap 60 min existant
--   (rétrocompat totale pour les merchants déjà actifs)
-- - Set = on rejette à vol d'oiseau (Haversine) au-delà du rayon, AVANT
--   tout appel routing → message explicite côté cliente
--
-- Couplé à un encart « hors zone » sur la vitrine BookingModal et un badge
-- « À domicile · jusqu'à X km » sur la page publique `/p/[slug]`.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS home_service_radius_km SMALLINT NULL
    CHECK (home_service_radius_km IS NULL OR home_service_radius_km BETWEEN 1 AND 200);

-- Backfill : les merchants qui ont déjà `home_service_enabled = true` repartent
-- avec un rayon par défaut de 15 km (estimation raisonnable pour une pro mobile
-- en zone urbaine/péri-urbaine). Ils peuvent ajuster dans /dashboard/planning.
-- Les merchants qui activeront home_service après la migration auront un
-- pré-rempli à 20 km côté UI (décision produit).
UPDATE merchants
  SET home_service_radius_km = 15
  WHERE home_service_enabled = true
    AND home_service_radius_km IS NULL;
