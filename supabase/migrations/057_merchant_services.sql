-- Migration 057: Tables merchant_service_categories + merchant_services

-- Categories
CREATE TABLE IF NOT EXISTS merchant_service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_service_categories_merchant ON merchant_service_categories(merchant_id);

ALTER TABLE merchant_service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their categories"
  ON merchant_service_categories FOR ALL
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Public can read categories"
  ON merchant_service_categories FOR SELECT
  USING (true);

-- Services
CREATE TABLE IF NOT EXISTS merchant_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES merchant_service_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_services_merchant ON merchant_services(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_services_category ON merchant_services(category_id);

ALTER TABLE merchant_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their services"
  ON merchant_services FOR ALL
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Public can read services"
  ON merchant_services FOR SELECT
  USING (true);
