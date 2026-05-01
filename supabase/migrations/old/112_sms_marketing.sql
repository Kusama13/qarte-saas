-- 112_sms_marketing.sql
-- Chantier SMS marketing complet : packs prépayés, campagnes modérées, opt-outs,
-- toggles par automatisation, types SMS étendus. Aucune donnée existante touchée.

-- ─── Colonnes merchants ──────────────────────────────────────────────
ALTER TABLE merchants
  -- Quota & alertes
  ADD COLUMN IF NOT EXISTS sms_pack_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sms_alert_80_sent_cycle DATE,
  ADD COLUMN IF NOT EXISTS sms_alert_100_sent_cycle DATE,
  -- Rappels RDV (transactionnel, dépend de planning_enabled côté UI)
  ADD COLUMN IF NOT EXISTS reminder_j1_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_j0_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Parrainage
  ADD COLUMN IF NOT EXISTS referral_reward_sms_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS referral_invite_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Fidélisation & avis
  ADD COLUMN IF NOT EXISTS welcome_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_visit_review_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_sms_include_link BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_review_url TEXT,
  ADD COLUMN IF NOT EXISTS voucher_expiry_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Relance
  ADD COLUMN IF NOT EXISTS inactive_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Événements saisonniers
  ADD COLUMN IF NOT EXISTS events_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS events_sms_offer_text TEXT,
  ADD COLUMN IF NOT EXISTS events_sms_last_event_id TEXT;

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

-- ─── CHECK étendu sur sms_logs.sms_type ─────────────────────────────
-- Types : 8 existants (reminder_j1, confirmations, birthday, referral_reward,
-- booking_moved/cancelled) + 6 nouveaux pour marketing & automations.
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;
ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check CHECK (
  sms_type IN (
    'reminder_j1',
    'reminder_j0',
    'confirmation_no_deposit',
    'confirmation_deposit',
    'birthday',
    'referral_reward',
    'booking_moved',
    'booking_cancelled',
    'campaign',
    'welcome',
    'review_request',
    'voucher_expiry',
    'referral_invite',
    'inactive_reminder'
  )
);

-- ─── RLS ────────────────────────────────────────────────────────────
ALTER TABLE sms_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_read_own_purchases" ON sms_pack_purchases;
CREATE POLICY "merchant_read_own_purchases" ON sms_pack_purchases
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "merchant_read_own_campaigns" ON sms_campaigns;
CREATE POLICY "merchant_read_own_campaigns" ON sms_campaigns
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "merchant_insert_own_campaigns" ON sms_campaigns;
CREATE POLICY "merchant_insert_own_campaigns" ON sms_campaigns
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "merchant_read_own_optouts" ON sms_opt_outs;
CREATE POLICY "merchant_read_own_optouts" ON sms_opt_outs
  FOR SELECT USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- ─── RPC : credit atomique d'un pack SMS ────────────────────────────
-- Appelé depuis le webhook Stripe pour éviter une race (read-then-write)
-- avec un sendSms concurrent qui décrémente sms_pack_balance.
CREATE OR REPLACE FUNCTION credit_sms_pack(p_merchant_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE merchants
  SET sms_pack_balance = sms_pack_balance + p_amount
  WHERE id = p_merchant_id
  RETURNING sms_pack_balance INTO new_balance;
  RETURN new_balance;
END;
$$;
