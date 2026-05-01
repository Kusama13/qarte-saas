-- Prorata quota SMS lors upgrade mid-cycle Fidélité → Tout-en-un
-- + niveau d'alerte 90% (nouveau) pour email "Achète un pack"
--
-- Contexte :
-- - Fidélité = quota 0, Tout-en-un = quota 100
-- - Upgrade mid-cycle doit donner quota prorata jours restants (arrondi)
-- - birthday + referral_reward SMS exclus du compteur (envoyés gracieusement)
--
-- Voir src/lib/sms.ts + docs/email-sms-trial-plan.md

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS sms_quota_override INTEGER,
  ADD COLUMN IF NOT EXISTS sms_quota_override_cycle_anchor TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_alert_90_sent_cycle DATE;

COMMENT ON COLUMN merchants.sms_quota_override IS
  'Quota prorata pour le cycle en cours (set on upgrade Fidélité → Tout-en-un). NULL = utilise le quota par défaut du plan_tier. Reset auto quand cycle change (anchor ≠ current cycle start).';

COMMENT ON COLUMN merchants.sms_quota_override_cycle_anchor IS
  'Date du cycle facturation (billing_period_start du cycle actif) pour lequel sms_quota_override s''applique. Si cette date ne correspond plus au cycle courant, override ignoré.';

COMMENT ON COLUMN merchants.sms_alert_90_sent_cycle IS
  'Date du cycle où l''alerte email 90% a été envoyée. Dedup par cycle.';
