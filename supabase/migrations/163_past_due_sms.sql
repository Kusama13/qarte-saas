-- Mig 163 — SMS dunning past_due (2 SMS : J0 + J+2)
-- ════════════════════════════════════════════════════════════════════════
-- Ajoute 2 SMS transactionnels au dunning past_due, en plus des 4 emails
-- existants (J0/J+3/J+7/J+10) :
--   - SMS 1 (J0)  : envoye par Stripe webhook invoice.payment_failed
--   - SMS 2 (J+2) : envoye par cron morning si past_due_sms2_sent_at IS NULL
--
-- Reset des deux flags a NULL sur invoice.payment_succeeded (cycle suivant
-- repart proprement si le merchant retombe en past_due plus tard).
--
-- Idempotent (IF NOT EXISTS / DROP IF EXISTS). Safe a relancer.

-- ─── 1. Colonnes dedup atomiques sur merchants ──────────────────────────
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS past_due_sms1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS past_due_sms2_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN merchants.past_due_sms1_sent_at IS
  'Timestamp envoi SMS dunning J0 (Stripe webhook invoice.payment_failed). NULL = pas encore envoye OU reset par invoice.payment_succeeded. Atomic claim via UPDATE WHERE IS NULL.';

COMMENT ON COLUMN merchants.past_due_sms2_sent_at IS
  'Timestamp envoi SMS dunning J+2 (cron morning). Conditionne aussi sur past_due_sms1_sent_at IS NOT NULL — on n''envoie pas le reminder si l''initial n''a pas pu partir.';

-- Index partiel : cron morning filtre rapidement les candidats SMS 2.
-- Past_due_sms1_sent_at IS NOT NULL filtre les merchants qui ont bien recu l'initial,
-- past_due_sms2_sent_at IS NULL filtre ceux qui n'ont pas encore le reminder.
CREATE INDEX IF NOT EXISTS idx_merchants_past_due_sms2_pending
  ON merchants(updated_at)
  WHERE subscription_status = 'past_due'
    AND past_due_sms1_sent_at IS NOT NULL
    AND past_due_sms2_sent_at IS NULL;

-- ─── 2. CHECK constraint sms_type aligne avec nouveaux types ────────────
-- TrialSmsType source-of-truth : src/lib/sms-trial-marketing.ts
-- + nouveaux types past_due_initial / past_due_reminder (src/lib/sms-past-due.ts)
ALTER TABLE merchant_marketing_sms_logs
  DROP CONSTRAINT IF EXISTS merchant_marketing_sms_logs_sms_type_check;

ALTER TABLE merchant_marketing_sms_logs
  ADD CONSTRAINT merchant_marketing_sms_logs_sms_type_check
  CHECK (sms_type IN (
    'celebration_fidelity',
    'celebration_planning',
    'celebration_vitrine',
    'checkin_nudge',
    'checkin_combo',
    'trial_pre_loss',
    'churn_survey',
    'example_vitrine',
    'past_due_initial',
    'past_due_reminder'
  ));
