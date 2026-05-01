-- Ambassador application system
-- Applications are stored separately from affiliate_links
-- On approval: a new affiliate_links row is created and linked via affiliate_id

CREATE TABLE public.ambassador_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  profile_type  TEXT NOT NULL CHECK (profile_type IN ('influencer','trainer','family_friend','sales_rep','other')),
  message       TEXT NOT NULL,
  requested_slug TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  affiliate_id  UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ,
  notes         TEXT
);

CREATE INDEX idx_ambassador_app_status ON public.ambassador_applications (status, created_at DESC);

-- Prevent duplicate pending applications for the same email
CREATE UNIQUE INDEX idx_ambassador_app_email_pending ON public.ambassador_applications (email) WHERE status = 'pending';

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
