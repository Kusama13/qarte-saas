-- 123_sms_logs_dedup_index.sql
-- Index composite pour accélérer les dedup checks SMS (hasSmsLog).
-- Le pattern dominant est : WHERE merchant_id = ? AND sms_type = ? AND created_at >= ?
-- L'index existant (merchant_id, created_at) ne couvre pas sms_type → scan de la fenêtre.
--
-- CONCURRENTLY pour éviter de locker les writes pendant la création sur grosse table.
-- Doit être exécuté hors transaction (Supabase SQL Editor le fait par défaut en autocommit).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sms_logs_merchant_type_date
  ON sms_logs(merchant_id, sms_type, created_at DESC);
