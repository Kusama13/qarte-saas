-- Mig 158 — flag dedup SMS "exemple de vitrine" envoye 15min apres signup
-- Voir trial-sms-copy.ts (exampleVitrineSmsBody) + cron sms-trial-marketing route SECTION 0

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS example_vitrine_sms_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN merchants.example_vitrine_sms_sent_at IS
  'Dedup flag — SMS exemple de vitrine envoye 15min+ apres signup via cron horaire. NULL = pas encore envoye.';

-- DEFENSE EN PROFONDEUR : backfill tous les merchants existants comme "deja envoye"
-- pour eviter incident 2026-04-20 (cron pickup massif sur base existante).
-- Seuls les merchants crees APRES cette migration recevront le SMS.
UPDATE merchants SET example_vitrine_sms_sent_at = NOW();

-- Index partiel sur les merchants encore eligibles au SMS (post-mig signups uniquement).
-- Apres backfill, NULL = signups recents = ensemble tres petit, parfait pour partial index.
CREATE INDEX IF NOT EXISTS idx_merchants_example_vitrine_pending
  ON merchants(created_at)
  WHERE example_vitrine_sms_sent_at IS NULL;
