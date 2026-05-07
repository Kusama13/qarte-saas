-- Mig 161 — étend la CHECK sur merchant_marketing_sms_logs.sms_type avec 'example_vitrine'
-- HOTFIX : la mig 158 a ajoute le type 'example_vitrine' (cron sms-trial-marketing SECTION 0)
-- mais a oublie d'etendre la contrainte CHECK existante de la table de logs.
-- Consequence : SMS envoyes chez OVH avec succes mais INSERT du log echoue -> pas de dedup.
-- Si le cron horaire repasse, risque d'envoi multiple au meme merchant.

ALTER TABLE merchant_marketing_sms_logs
  DROP CONSTRAINT IF EXISTS merchant_marketing_sms_logs_sms_type_check;

ALTER TABLE merchant_marketing_sms_logs
  ADD CONSTRAINT merchant_marketing_sms_logs_sms_type_check
  CHECK (sms_type IN (
    'celebration_fidelity',
    'celebration_planning',
    'celebration_vitrine',
    'trial_pre_loss',
    'churn_survey',
    'example_vitrine'
  ));
