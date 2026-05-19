-- Mig 169 — Suppression du formulaire de churn (questionnaire post-expiration)
--
-- Le questionnaire de rétention post-J+3 (`/dashboard/survey`) est retiré :
-- après plusieurs mois il ne convertit pas — les pros qui veulent s'abonner
-- le font avant la fin de l'essai. On supprime la table, les colonnes et le RPC.
--
-- Code retiré en parallèle : pages survey + admin/churn-surveys, routes
-- /api/churn-survey, /api/admin/churn-surveys, /api/merchant/survey-skip,
-- 3 templates email (ChurnSurveyReminder, PostSurveyFollowUp, PostSurveyLastChance),
-- section 1b du cron `morning`.
--
-- NOTE : on conserve la valeur `churn_survey` dans le CHECK de
-- `merchant_marketing_sms_logs.sms_type` (lignes historiques déjà loguées —
-- le retirer ferait échouer la contrainte sur les données existantes).

-- 1. Table du questionnaire (DROP CASCADE → indexes + RLS associés)
DROP TABLE IF EXISTS merchant_churn_surveys CASCADE;

-- 2. RPC d'incrément atomique du compteur de skip (mig 128)
DROP FUNCTION IF EXISTS increment_churn_survey_skip(UUID, INTEGER);

-- 3. Colonnes sur merchants (DROP COLUMN supprime aussi les indexes partiels dépendants)
ALTER TABLE merchants
  DROP COLUMN IF EXISTS churn_survey_seen_at,
  DROP COLUMN IF EXISTS churn_survey_skip_count,
  DROP COLUMN IF EXISTS team_demo_requested_at;
