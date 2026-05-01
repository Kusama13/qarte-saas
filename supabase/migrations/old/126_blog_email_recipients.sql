-- Migration 126 : per-merchant dedup pour le cron blog-digest
--
-- La table 125 `blog_email_dispatches` ne stocke qu'une ligne par article
-- (article_slug PK + sent_at + recipient_count) — impossible de savoir QUI a
-- recu QUOI. Avec l'audience etendue (paid subs + nouveaux trials), il faut
-- garantir qu'un merchant ne recoit jamais 2 fois le meme article slug, meme
-- en cas de retry/crash mid-loop.

CREATE TABLE IF NOT EXISTS blog_email_recipients (
  article_slug TEXT NOT NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_slug, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_email_recipients_merchant
  ON blog_email_recipients(merchant_id);

ALTER TABLE blog_email_recipients ENABLE ROW LEVEL SECURITY;
-- Pas de policy : service_role only (cron + admin)
