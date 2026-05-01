-- Admin expenses table for tracking project costs
CREATE TABLE IF NOT EXISTS admin_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('infra', 'marketing', 'fb_ads', 'outils', 'autre')),
  amount DECIMAL(10, 2) NOT NULL,
  month VARCHAR(7) NOT NULL, -- Format YYYY-MM
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by month
CREATE INDEX IF NOT EXISTS idx_admin_expenses_month ON admin_expenses(month);

-- RLS (Row Level Security) - Only authenticated admin users can access
ALTER TABLE admin_expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read expenses
CREATE POLICY "Admins can read expenses"
  ON admin_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );

-- Policy: Only admins can insert expenses
CREATE POLICY "Admins can insert expenses"
  ON admin_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );

-- Policy: Only admins can delete expenses
CREATE POLICY "Admins can delete expenses"
  ON admin_expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );
