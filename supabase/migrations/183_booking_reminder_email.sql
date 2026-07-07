-- Migration 183 : rappel de RDV par email la veille + infos pratiques du merchant
--
-- Certains merchants veulent envoyer des détails pratiques à leur cliente avant le RDV
-- (adresse & accès, parking, « venez les cheveux propres », arriver 5 min avant...).
-- On ajoute un email de rappel envoyé la veille au matin (cron dédié), porteur de ces
-- détails. Le SMS J-1 existant (Marketing > Automatisations) reste inchangé et court.
--
-- Réglé dans Planning > Paramètres > Notifs. Opt-in (DEFAULT FALSE). Sans effet tant
-- que la cliente n'a pas laissé d'email au booking → couverture partielle assumée.

-- Deux canaux INDÉPENDANTS où diffuser les infos pratiques, au libre choix du merchant :
--  - booking_reminder_email_enabled : email de rappel envoyé la veille au matin (cron).
--  - booking_reminder_in_confirmation : ajouter les infos à l'email de confirmation (au booking).
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_reminder_email_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_reminder_in_confirmation BOOLEAN NOT NULL DEFAULT FALSE;

-- Infos pratiques (texte libre) injectées dans l'email de rappel ET dans l'email de
-- confirmation. Un seul champ global par merchant (pas par prestation). Longueur bornée
-- côté app (textarea maxLength) ; garde-fou DB à 600 caractères.
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_reminder_details TEXT NULL
  CHECK (booking_reminder_details IS NULL OR char_length(booking_reminder_details) <= 600);

-- Marqueur anti-doublon au niveau du créneau (les emails transactionnels ne sont pas
-- tracés comme les SMS via sms_logs). Renseigné quand le rappel a été envoyé.
ALTER TABLE merchant_planning_slots ADD COLUMN IF NOT EXISTS reminder_email_sent_at TIMESTAMPTZ NULL;
