-- Migration 152 — processed_stripe_events : dedup webhook Stripe par event.id
--
-- Bug : le handler /api/stripe/webhook traite chaque webhook reçu sans
-- vérifier event.id. Stripe retente jusqu'à 3 fois en 24h sur timeout (>30s)
-- ou réponse non-2xx, ce qui re-déclenche les emails non-idempotents
-- (subscription.updated/deleted, invoice.payment_failed/succeeded). Les SMS
-- packs étaient protégés par un .eq('status', 'pending') applicatif, mais
-- pas le reste — d'où des relances Stripe = 2-3 emails au merchant.
--
-- Fix : INSERT event.id en tête de handler. Si conflit PK → déjà traité,
-- return 200 direct sans relancer le travail. Roadmap P0 #1.

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur processed_at : Stripe retente max 24h, donc une purge mensuelle
-- des events > 30 jours est sans risque (à câbler dans un cron plus tard).
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_processed_at
  ON processed_stripe_events(processed_at);

-- Table accessible uniquement via service_role (webhook handler). RLS activée
-- sans policy = aucun rôle non-service ne peut lire/écrire.
ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;
