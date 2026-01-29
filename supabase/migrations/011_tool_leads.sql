-- Tool leads table for capturing prospects from free tools
CREATE TABLE IF NOT EXISTS tool_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  source TEXT NOT NULL, -- 'qr-menu', 'google-review', 'ebook'
  business_name TEXT,
  generated_value TEXT, -- URL or link they generated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  notes TEXT
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_tool_leads_email ON tool_leads(email);
CREATE INDEX IF NOT EXISTS idx_tool_leads_source ON tool_leads(source);
CREATE INDEX IF NOT EXISTS idx_tool_leads_created ON tool_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_leads_converted ON tool_leads(converted);

-- Unique constraint on email + source (same email can use different tools)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_leads_email_source ON tool_leads(email, source);
