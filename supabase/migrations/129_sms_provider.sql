-- 129_sms_provider.sql
-- Ajoute la colonne `provider` à sms_logs pour distinguer OVH (marketing + transactionnel CH)
-- de SMS Partner (transactionnel FR/BE).
--
-- La colonne `ovh_job_id` reste conservée (sémantique élargie : ID externe du provider,
-- qu'il s'agisse d'un job OVH ou d'un message_id SMS Partner). Pas de renommage pour
-- éviter une migration cassante sur historique.

ALTER TABLE sms_logs
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'ovh'
    CHECK (provider IN ('ovh', 'sms_partner'));

-- Index pour reporting admin par provider (cost analysis, taux d'échec par fournisseur).
-- Pas de CONCURRENTLY : Supabase SQL Editor exécute en transaction implicite et le rejette.
-- Acceptable ici : nouvelle colonne avec valeur uniforme ('ovh' partout), création quasi-instantanée.
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_date
  ON sms_logs (provider, created_at DESC);
