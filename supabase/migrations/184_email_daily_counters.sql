-- Migration 184 — compteur quotidien d'emails par catégorie.
-- Sert au garde-fou "budget marketing" dans src/lib/email.ts (sendEmail) : au-delà de
-- EMAIL_MARKETING_DAILY_CAP envois marketing sur la journée (fuseau Paris), on coupe le
-- marketing pour préserver le quota Resend au transactionnel. Le transactionnel n'est pas compté.

CREATE TABLE IF NOT EXISTS email_daily_counters (
  day DATE NOT NULL,
  category TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, category)
);

ALTER TABLE email_daily_counters ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accès service_role uniquement (bypass RLS côté serveur).

-- Incrémente atomiquement et renvoie le nouveau total du jour pour la catégorie.
CREATE OR REPLACE FUNCTION increment_email_counter(p_day DATE, p_category TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO email_daily_counters (day, category, count)
  VALUES (p_day, p_category, 1)
  ON CONFLICT (day, category) DO UPDATE SET count = email_daily_counters.count + 1
  RETURNING count;
$$;
