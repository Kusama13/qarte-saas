-- Mig 162 — Robustesse SMS transactionnels
-- ════════════════════════════════════════════════════════════════════════
-- Objectifs :
--   1. Stocker la classe d'erreur (timeout/invalid_phone/no_credit/...) pour
--      decider intelligemment du fallback (vs blind retry actuel qui cause doublons)
--   2. Tracer le DLR webhook SMS Partner (delivery confirmation)
--   3. Etat 'pending_verify' pour SMS en attente de DLR (timeout SMS Partner ambigu)
--   4. provider_msg_id (renomme conceptuellement ovh_job_id qui est mal nomme : c'est aussi le SMS Partner message_id)
--   5. Blacklist des numeros invalides definitivement (anti gaspillage credits)
--
-- Hors scope : marketing campagnes + trial marketing (table merchant_marketing_sms_logs)
-- restent inchangees, pas de fallback ni retry.

-- ─── 1. Extend status CHECK avec 'pending_verify' ───────────────────────
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_status_check;

-- L'ancien CHECK n'avait pas de nom explicite. On le recree avec un nom +
-- la nouvelle valeur 'pending_verify'. 'delivered' existait deja dans l'ancien
-- CHECK mais n'etait pas utilise par le code — on le garde pour le webhook DLR.
ALTER TABLE sms_logs
  ADD CONSTRAINT sms_logs_status_check
  CHECK (status IN ('sent', 'delivered', 'failed', 'pending_verify'));

-- ─── 2. Nouvelles colonnes pour traque erreur + DLR ─────────────────────
ALTER TABLE sms_logs
  ADD COLUMN IF NOT EXISTS error_class TEXT
    CHECK (error_class IN ('success', 'invalid_phone', 'no_credit', 'rate_limit', 'timeout', 'server_error', 'config_error', 'unknown')),
  ADD COLUMN IF NOT EXISTS provider_msg_id TEXT,
  ADD COLUMN IF NOT EXISTS fallback_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dlr_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verify_after TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT
    CHECK (delivery_status IN ('delivered', 'not_delivered', 'waiting'));

COMMENT ON COLUMN sms_logs.error_class IS
  'Classification metier de l''erreur. Decide si fallback safe (timeout/server_error) ou inutile (invalid_phone). NULL = pas d''erreur.';
COMMENT ON COLUMN sms_logs.provider_msg_id IS
  'Identifiant SMS chez le provider (OVH ids[0] ou SMS Partner message_id). Utilise par le webhook DLR pour matcher.';
COMMENT ON COLUMN sms_logs.fallback_attempted_at IS
  'Timestamp si un fallback (autre provider) a ete tente sur ce SMS.';
COMMENT ON COLUMN sms_logs.dlr_received_at IS
  'Timestamp de reception du DLR webhook (SMS Partner). NULL si pas de DLR (OVH ou pas encore recu).';
COMMENT ON COLUMN sms_logs.verify_after IS
  'Pour status=pending_verify : apres ce timestamp, le cron sms-verify decide (DLR reçu? → done; sinon → fallback OVH). Typiquement NOW()+10min.';
COMMENT ON COLUMN sms_logs.delivery_status IS
  'Statut DLR raw retourne par SMS Partner : delivered/not_delivered/waiting. Distinct du `status` (notre etat interne sent/failed/pending_verify/delivered).';

-- ─── 3. Indexes hot path : cron sms-verify + webhook DLR lookup ────────
-- Composite (status, verify_after) pour cron qui filtre sur les 2.
CREATE INDEX IF NOT EXISTS idx_sms_logs_pending_verify
  ON sms_logs(status, verify_after)
  WHERE status = 'pending_verify' AND verify_after IS NOT NULL;

-- Index DLR webhook (lookup par provider + provider_msg_id).
-- Sans cet index : full scan sur sms_logs a chaque webhook -> latence 30s+
-- -> SMS Partner timeout cote eux -> retry webhook -> doublons.
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_msg_id
  ON sms_logs(provider, provider_msg_id)
  WHERE provider_msg_id IS NOT NULL;

-- ─── 4. Backfill provider_msg_id depuis ovh_job_id ──────────────────────
-- ovh_job_id contient deja les msg_id pour les 2 providers (mal nomme).
-- On copie pour ne pas casser l'existant. Future : drop ovh_job_id quand le code est migre.
UPDATE sms_logs SET provider_msg_id = ovh_job_id
WHERE provider_msg_id IS NULL AND ovh_job_id IS NOT NULL;

-- ─── 5. Blacklist numeros invalides (anti gaspillage credit) ────────────
CREATE TABLE IF NOT EXISTS sms_phone_blacklist (
  phone TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  detected_provider TEXT CHECK (detected_provider IN ('ovh', 'sms_partner', 'both')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count INT NOT NULL DEFAULT 1
);

COMMENT ON TABLE sms_phone_blacklist IS
  'Numeros confirmes invalides apres 2+ tentatives sur 2 providers. Skip envoi a la source pour eviter de cramer du credit.';

ALTER TABLE sms_phone_blacklist ENABLE ROW LEVEL SECURITY;

-- Aucune RLS policy : table accessible uniquement service_role (pas de SELECT public).

-- ─── 6. App config pour dedup admin alerts (max 1 alerte/heure par type) ─
-- (la table app_config existe deja, juste documenter les nouvelles cles)
COMMENT ON TABLE app_config IS
  'Cles utilisees par le systeme SMS robustesse :
    sms_alert_config_error_last_sent_at (timestamp)
    sms_alert_no_credit_ovh_last_sent_at
    sms_alert_no_credit_sms_partner_last_sent_at
    sms_alert_high_failure_rate_last_sent_at
    sms_alert_batch_audit_last_sent_at';
