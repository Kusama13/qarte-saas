-- Table de tracking pour les emails de réactivation
-- Évite d'envoyer le même email plusieurs fois

CREATE TABLE IF NOT EXISTS reactivation_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  day_sent INTEGER NOT NULL, -- 7, 14, ou 30
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un seul email par merchant par jour d'envoi
  UNIQUE(merchant_id, day_sent)
);

-- Index pour les requêtes de nettoyage
CREATE INDEX idx_reactivation_tracking_sent_at ON reactivation_email_tracking(sent_at);

-- RLS: Seul le service role peut accéder
ALTER TABLE reactivation_email_tracking ENABLE ROW LEVEL SECURITY;

-- Pas de policy = accès uniquement via service_role (cron)
