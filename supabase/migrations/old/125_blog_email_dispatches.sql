-- 125_blog_email_dispatches.sql
-- Track quel article de blog a ete envoye par mail aux merchants et quand.
-- Permet au cron blog-digest de :
--   1. Ne pas renvoyer le meme article 2 fois
--   2. Espacer les envois (>= 3 jours depuis le dernier dispatch)
--   3. Reprendre automatiquement quand de nouveaux articles sont publies

CREATE TABLE IF NOT EXISTS blog_email_dispatches (
  article_slug TEXT PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blog_email_dispatches_sent_at
  ON blog_email_dispatches(sent_at DESC);

-- RLS : lecture/ecriture admin only (via service_role). Pas de policy merchant.
ALTER TABLE blog_email_dispatches ENABLE ROW LEVEL SECURITY;
