-- Migration 127 : tracking churn (raison annulation, skip survey, demo requested)
--
-- Avant : aucune trace des raisons d'annulation (state React perdu au unmount).
--         La survey re-affichait indefiniment apres skip. Les demandes de demo
--         (Q4 = team_demo) accordaient 5 jours bonus mais sans tracking admin.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_survey_skip_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS team_demo_requested_at TIMESTAMPTZ;

-- Check constraint sur cancellation_reason (les 6 valeurs du modal save-offer)
ALTER TABLE merchants
  DROP CONSTRAINT IF EXISTS merchants_cancellation_reason_check;
ALTER TABLE merchants
  ADD CONSTRAINT merchants_cancellation_reason_check
  CHECK (cancellation_reason IS NULL OR cancellation_reason IN (
    'too_expensive', 'not_using', 'missing_feature', 'switching', 'temporary', 'other'
  ));

-- Index pour analytics churn drivers
CREATE INDEX IF NOT EXISTS idx_merchants_cancellation_reason
  ON merchants(cancellation_reason, cancellation_reason_at DESC)
  WHERE cancellation_reason IS NOT NULL;

-- Index pour suivi admin des demandes de demo
CREATE INDEX IF NOT EXISTS idx_merchants_team_demo_requested
  ON merchants(team_demo_requested_at DESC)
  WHERE team_demo_requested_at IS NOT NULL;
