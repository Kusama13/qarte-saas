-- ============================================
-- MIGRATION 051: Fix schema drift v2
--
-- Colonnes ajoutees manuellement en prod (dashboard/API)
-- mais absentes des migrations. Bloque `supabase db reset`.
-- ============================================

-- 1. Social links + booking
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS snapchat_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_url TEXT;

-- 2. Billing interval (set by Stripe webhook)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly';

-- 3. Revenue snapshots (admin metriques)
CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  active_subscribers INTEGER DEFAULT 0,
  trial_users INTEGER DEFAULT 0,
  cancelled_users INTEGER DEFAULT 0,
  mrr NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: super_admins only
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage revenue snapshots"
  ON revenue_snapshots FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM super_admins));

CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date DESC);
