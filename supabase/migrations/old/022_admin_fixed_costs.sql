-- Admin fixed costs table for recurring monthly expenses
CREATE TABLE IF NOT EXISTS admin_fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('infra', 'marketing', 'fb_ads', 'outils', 'autre')),
  monthly_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE admin_fixed_costs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read
CREATE POLICY "Admins can read fixed costs"
  ON admin_fixed_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );

-- Policy: Only admins can insert
CREATE POLICY "Admins can insert fixed costs"
  ON admin_fixed_costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );

-- Policy: Only admins can update
CREATE POLICY "Admins can update fixed costs"
  ON admin_fixed_costs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );

-- Policy: Only admins can delete
CREATE POLICY "Admins can delete fixed costs"
  ON admin_fixed_costs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = auth.uid()
      AND merchants.is_admin = TRUE
    )
  );
