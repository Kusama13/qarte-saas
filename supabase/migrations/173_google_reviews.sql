-- Migration 173 — Avis Google sur la vitrine
-- Stocke le place_id Google du salon (stockable indéfiniment côté ToS) +
-- un cache court (72h) de la note / nb d'avis / 5 derniers avis pour rester
-- dans le palier gratuit de la Places API (New) et respecter le ToS (pas de
-- stockage durable du contenu des avis).

-- 1. place_id de la fiche Google du salon
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS google_place_id TEXT;

COMMENT ON COLUMN merchants.google_place_id IS
  'Google Place ID de la fiche du salon (Places API New). Stockable indéfiniment (ToS). Utilisé pour afficher note + avis sur la vitrine /p/[slug].';

-- 2. Cache des avis (TTL applicatif 72h via fetched_at)
CREATE TABLE IF NOT EXISTS merchant_google_reviews_cache (
  merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
  rating NUMERIC(2,1),
  rating_count INTEGER DEFAULT 0,
  reviews JSONB DEFAULT '[]'::jsonb,
  maps_uri TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE merchant_google_reviews_cache IS
  'Cache court (72h) des avis Google par salon. Rafraîchi à la consultation de la vitrine si fetched_at > 72h. Le texte des avis ne doit pas y vivre au-delà du TTL (ToS Google).';

-- Accès service_role uniquement (lecture vitrine via supabaseAdmin). RLS activé,
-- aucune policy publique : seul service_role (bypass RLS) lit/écrit.
ALTER TABLE merchant_google_reviews_cache ENABLE ROW LEVEL SECURITY;
