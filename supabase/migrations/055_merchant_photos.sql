-- Table pour les photos de realisations des merchants (max 6)
CREATE TABLE merchant_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  url text NOT NULL,
  position smallint NOT NULL DEFAULT 1 CHECK (position >= 1 AND position <= 6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_photos_merchant ON merchant_photos(merchant_id);

-- Max 6 photos par merchant (unique sur merchant_id + position)
CREATE UNIQUE INDEX idx_merchant_photos_position ON merchant_photos(merchant_id, position);

-- RLS
ALTER TABLE merchant_photos ENABLE ROW LEVEL SECURITY;

-- Public read (page /p/[slug])
CREATE POLICY "Public can view merchant photos"
  ON merchant_photos FOR SELECT
  USING (true);

-- Merchant can manage own photos
CREATE POLICY "Merchant can insert own photos"
  ON merchant_photos FOR INSERT
  WITH CHECK (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchant can update own photos"
  ON merchant_photos FOR UPDATE
  USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchant can delete own photos"
  ON merchant_photos FOR DELETE
  USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));
