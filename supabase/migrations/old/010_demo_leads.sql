-- Demo leads table for capturing prospects who test the demo
CREATE TABLE IF NOT EXISTS demo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  notes TEXT
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_demo_leads_phone ON demo_leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_demo_leads_created ON demo_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_leads_converted ON demo_leads(converted);

-- Prevent duplicate phone numbers (only keep the first entry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_leads_phone_unique ON demo_leads(phone_number);
