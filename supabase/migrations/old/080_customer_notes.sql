-- Customer notes / journal de suivi client
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES merchant_planning_slots(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_notes_lookup
  ON customer_notes (customer_id, merchant_id, created_at DESC);

CREATE INDEX idx_customer_notes_pinned
  ON customer_notes (customer_id, merchant_id)
  WHERE pinned = TRUE;

-- RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage their own customer notes"
  ON customer_notes
  FOR ALL
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );
