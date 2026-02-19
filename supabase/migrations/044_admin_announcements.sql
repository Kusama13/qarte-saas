-- Admin announcements system for merchant dashboard banners

CREATE TABLE IF NOT EXISTS admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  target_filter TEXT NOT NULL DEFAULT 'all' CHECK (target_filter IN ('all', 'trial', 'active', 'pwa_installed', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  duration_days INTEGER, -- NULL = no expiry
  expires_at TIMESTAMPTZ, -- computed on publish: published_at + duration_days
  is_published BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_published
  ON admin_announcements (is_published, published_at DESC)
  WHERE is_published = true;

-- RLS: only service_role (admin) can access
ALTER TABLE admin_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_announcements"
  ON admin_announcements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to read published announcements
CREATE POLICY "Authenticated users can read published announcements"
  ON admin_announcements FOR SELECT
  USING (auth.role() = 'authenticated' AND is_published = true);

-- Dismissals tracking
CREATE TABLE IF NOT EXISTS admin_announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES admin_announcements(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_merchant
  ON admin_announcement_dismissals (merchant_id);

ALTER TABLE admin_announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on dismissals"
  ON admin_announcement_dismissals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Merchants can insert their own dismissals
CREATE POLICY "Merchants can dismiss announcements"
  ON admin_announcement_dismissals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants WHERE merchants.id = merchant_id AND merchants.user_id = auth.uid()
    )
  );

-- Merchants can read their own dismissals
CREATE POLICY "Merchants can read own dismissals"
  ON admin_announcement_dismissals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants WHERE merchants.id = merchant_id AND merchants.user_id = auth.uid()
    )
  );
