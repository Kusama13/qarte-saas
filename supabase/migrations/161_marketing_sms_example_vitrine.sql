-- Mig 161 — synchronise CHECK merchant_marketing_sms_logs.sms_type avec le code
-- HOTFIX : la mig 158 a ajoute le type 'example_vitrine' (cron sms-trial-marketing SECTION 0)
-- mais a oublie d'etendre la contrainte CHECK existante. Symptome 2026-05-07 :
-- INSERT log row echoue avec 23514 violates check constraint apres envoi OVH.
--
-- Pas de risque de re-envoi : le flag dedup merchants.example_vitrine_sms_sent_at
-- est set independamment du log row (sms-trial-marketing.ts:135-140).
--
-- Au passage on rajoute checkin_nudge + checkin_combo qui etaient absents de la
-- CHECK depuis toujours (utilises dans le code des le check-in 48h, source-of-truth
-- = TrialSmsType union dans sms-trial-marketing.ts).

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
    'example_vitrine'
  ));
