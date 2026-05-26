-- QuickStart email (J+0 +3h, séquence trial 3j)
-- Dedup column dans merchants pour s'assurer que l'email part une seule fois par merchant.
-- Le cron horaire sms-trial-marketing fait le filtrage IS NULL puis set NOW() après envoi.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS quickstart_email_sent_at TIMESTAMPTZ;
