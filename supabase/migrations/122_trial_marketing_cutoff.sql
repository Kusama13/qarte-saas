-- Trial marketing SMS v3 — backfill + nouveaux flags dedup
-- Voir docs/sms-system.md + .claude/plans/delightful-exploring-lemon.md
--
-- Contexte : le 20 avril 2026, le cron sms-trial-marketing a envoyé le SMS
-- célébration à TOUS les merchants existants en trial faute de backfill
-- de celebration_sms_sent_at. Cette migration ferme cette classe de bug :
--
-- 1. Backfill celebration_sms_sent_at pour tous les merchants existants
--    (empêche tout envoi rétroactif même si quelqu'un modifie le cutoff code).
-- 2. Ajoute pre_loss_sms_sent_at et churn_sms_sent_at comme colonnes flags
--    (plus fiable que log-check, atomique avec l'UPDATE dans le cron).
-- 3. Backfill ces deux nouveaux flags pour tous les merchants existants.
--
-- Combiné avec TRIAL_MARKETING_CUTOFF en code (src/lib/trial-marketing-cutoff.ts),
-- seuls les merchants créés à partir du 2026-04-20 peuvent recevoir un SMS
-- marketing trial.

-- 1. Backfill celebration (évite ré-envoi rétroactif si flag reset)
UPDATE merchants
SET celebration_sms_sent_at = NOW()
WHERE celebration_sms_sent_at IS NULL;

-- 2. Nouveaux flags dedup
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS pre_loss_sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_sms_sent_at TIMESTAMPTZ;

-- 3. Backfill des deux nouveaux flags
UPDATE merchants SET pre_loss_sms_sent_at = NOW() WHERE pre_loss_sms_sent_at IS NULL;
UPDATE merchants SET churn_sms_sent_at = NOW() WHERE churn_sms_sent_at IS NULL;

COMMENT ON COLUMN merchants.pre_loss_sms_sent_at IS
  'Timestamp du SMS pre-loss J-1 envoyé. NULL = jamais envoyé. Dedup par merchant.';

COMMENT ON COLUMN merchants.churn_sms_sent_at IS
  'Timestamp du SMS churn survey envoyé. NULL = jamais envoyé. Dedup par merchant.';
