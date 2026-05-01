-- Admin Tools Migration
-- Notes, Tasks, and Prospects CRM for admin dashboard

-- ============================================
-- ADMIN NOTES (simple notepad)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default empty note
INSERT INTO admin_notes (content) VALUES ('') ON CONFLICT DO NOTHING;

-- ============================================
-- ADMIN TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_completed ON admin_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON admin_tasks(due_date);

-- ============================================
-- PROSPECTS CRM
-- ============================================
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  source TEXT, -- 'cold_call', 'referral', 'website', 'social', 'other'
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'demo_done', 'trial', 'converted', 'lost')),
  notes TEXT,
  next_followup DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  converted_merchant_id UUID REFERENCES merchants(id)
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_next_followup ON prospects(next_followup);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at DESC);

-- ============================================
-- RLS POLICIES (admin access only via service key)
-- ============================================
-- These tables are accessed via service key (supabaseAdmin), so no RLS needed
-- But we enable it for safety
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role access admin_notes" ON admin_notes FOR ALL USING (true);
CREATE POLICY "Service role access admin_tasks" ON admin_tasks FOR ALL USING (true);
CREATE POLICY "Service role access prospects" ON prospects FOR ALL USING (true);
