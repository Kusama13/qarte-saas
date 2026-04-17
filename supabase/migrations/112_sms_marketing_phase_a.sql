-- 112_sms_marketing_phase_a.sql
-- Phase A du chantier SMS marketing : solde packs, achats, campagnes, opt-outs clients,
-- dedup des alertes quota. Aucune donnée existante touchée.

-- ─── Colonnes merchants ──────────────────────────────────────────────
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS sms_pack_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sms_alert_80_sent_cycle DATE,
  ADD COLUMN IF NOT EXISTS sms_alert_100_sent_cycle DATE,
  ADD COLUMN IF NOT EXISTS reminder_j1_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_j0_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_visit_review_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_sms_include_link BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_review_url TEXT;

-- ─── Table : achats de packs SMS (audit + facturation) ──────────────
CREATE TABLE IF NOT EXISTS sms_pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  pack_size INTEGER NOT NULL CHECK (pack_size IN (50, 100, 150, 200, 250)),
  amount_ht_cents INTEGER NOT NULL,
  processing_fee_ht_cents INTEGER NOT NULL DEFAULT 100,
  vat_rate NUMERIC(4,3) NOT NULL DEFAULT 0.200,
  amount_ttc_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sms_pack_purchases_merchant
  ON sms_pack_purchases (merchant_id, created_at DESC);

-- ─── Table : campagnes SMS (composer + modération admin) ────────────
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('template', 'custom')),
  template_id TEXT,
  body TEXT NOT NULL,
  audience_filter JSONB NOT NULL,
  recipient_count INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'scheduled', 'sending', 'done', 'failed')),
  review_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_merchant
  ON sms_campaigns (merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_pending_review
  ON sms_campaigns (created_at) WHERE status = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled
  ON sms_campaigns (scheduled_at) WHERE status = 'scheduled';

-- ─── Table : opt-outs SMS (un couple phone+merchant) ────────────────
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  phone_number TEXT NOT NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT CHECK (reason IN ('link', 'stop_reply', 'manual', 'complaint')),
  PRIMARY KEY (phone_number, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs (phone_number);

-- ─── RLS ────────────────────────────────────────────────────────────
ALTER TABLE sms_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;

-- Merchants : lecture seule sur leurs propres achats
DROP POLICY IF EXISTS "merchant_read_own_purchases" ON sms_pack_purchases;
CREATE POLICY "merchant_read_own_purchases" ON sms_pack_purchases
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Merchants : CRUD sur leurs propres campagnes
DROP POLICY IF EXISTS "merchant_read_own_campaigns" ON sms_campaigns;
CREATE POLICY "merchant_read_own_campaigns" ON sms_campaigns
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "merchant_insert_own_campaigns" ON sms_campaigns;
CREATE POLICY "merchant_insert_own_campaigns" ON sms_campaigns
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Merchants : lecture de leurs propres opt-outs (pour affichage)
DROP POLICY IF EXISTS "merchant_read_own_optouts" ON sms_opt_outs;
CREATE POLICY "merchant_read_own_optouts" ON sms_opt_outs
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
