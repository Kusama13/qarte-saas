-- 138 — gift cards (bons cadeaux)
--
-- Bons cadeaux offerts par un client à un destinataire, payés via lien externe
-- merchant (Revolut/PayPal/etc — pas d'integration paiement Qarte). Le merchant
-- valide manuellement la réception du paiement, ce qui :
--   1. Crée/récupère le customer destinataire + sa loyalty_card chez ce merchant
--   2. Crée un voucher (source='gift') sur cette carte avec l'amount du bon
--   3. Envoie un SMS au destinataire (+ email si fourni)
--   4. Envoie un email de confirmation à l'offreur
--
-- Quand le voucher est consommé (via /api/vouchers/use existant), on lookup la
-- gift_card via voucher_id → SMS systématique à l'offreur "Untel a utilisé ton
-- cadeau". Pas de configuration côté merchant.
--
-- Auto-cancel des pending_payment > 3 jours via cron horaire.

-- ============================================
-- merchants : config bons cadeaux
-- ============================================

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_amounts JSONB NOT NULL DEFAULT '[30, 50, 80, 100]'::jsonb;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_message TEXT;

COMMENT ON COLUMN merchants.gift_card_enabled IS
  'Active la vente de bons cadeaux sur la vitrine publique';
COMMENT ON COLUMN merchants.gift_card_amounts IS
  'Array JSON de montants suggérés en EUR/CHF, ex: [30, 50, 80, 100]';
COMMENT ON COLUMN merchants.gift_card_message IS
  'Mot personnalisé du merchant affiché sur la modal vitrine (optionnel, max 300 chars)';

DO $$ BEGIN
  ALTER TABLE merchants ADD CONSTRAINT merchants_gift_card_message_length
    CHECK (gift_card_message IS NULL OR length(gift_card_message) <= 300);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- gift_cards : commandes de bons cadeaux
-- ============================================

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Code public unique (ex: GIFT-AB12CD), affiché à l'offreur pour mettre en
  -- commentaire de virement, et utilisé comme reference dans les emails/SMS
  code TEXT NOT NULL UNIQUE,

  -- Montant en devise du merchant (cohérent avec deposit_amount, prix services)
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0 AND amount <= 1000),

  -- ============ OFFREUR ============
  sender_first_name TEXT NOT NULL CHECK (length(sender_first_name) BETWEEN 1 AND 60),
  sender_phone TEXT NOT NULL,                     -- E.164 sans +
  sender_phone_country VARCHAR(2),                -- FR/BE/CH (pour formatage)
  sender_email TEXT NOT NULL CHECK (length(sender_email) <= 255),
  sender_message TEXT CHECK (sender_message IS NULL OR length(sender_message) <= 300),

  -- ============ DESTINATAIRE ============
  recipient_first_name TEXT NOT NULL CHECK (length(recipient_first_name) BETWEEN 1 AND 60),
  recipient_phone TEXT NOT NULL,                  -- E.164 sans +
  recipient_phone_country VARCHAR(2),
  recipient_email TEXT CHECK (recipient_email IS NULL OR length(recipient_email) <= 255),

  -- ============ ÉTAT ============
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'active', 'used', 'cancelled', 'expired')),

  -- Lien vers le voucher créé au moment de la confirmation de paiement
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  -- Customer destinataire créé/récupéré au paiement (utile pour deep-link client)
  recipient_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  paid_at TIMESTAMPTZ,                            -- quand le merchant a validé le paiement
  used_at TIMESTAMPTZ,                            -- quand le voucher a été consommé
  cancelled_at TIMESTAMPTZ,                       -- quand le merchant a annulé OU auto-cancel cron
  cancellation_reason TEXT,                       -- 'merchant' / 'auto_expired_3d' / 'no_payment'
  expires_at TIMESTAMPTZ,                         -- 3 mois après paid_at (cf GIFT_CARD_EXPIRY_MONTHS)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_gift_cards_merchant_status
  ON gift_cards(merchant_id, status, created_at DESC);

-- Lookup voucher → gift_card (pour SMS offreur quand consommé)
CREATE INDEX IF NOT EXISTS idx_gift_cards_voucher
  ON gift_cards(voucher_id) WHERE voucher_id IS NOT NULL;

-- Cron auto-cancel (pending_payment > 3j)
CREATE INDEX IF NOT EXISTS idx_gift_cards_pending_old
  ON gift_cards(created_at) WHERE status = 'pending_payment';

-- ============================================
-- Trigger updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS : merchant SELECT/UPDATE own, INSERT public (rate-limited côté API)
-- ============================================

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants read own gift cards" ON gift_cards;
CREATE POLICY "Merchants read own gift cards"
  ON gift_cards FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Merchants update own gift cards" ON gift_cards;
CREATE POLICY "Merchants update own gift cards"
  ON gift_cards FOR UPDATE
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- INSERT et SELECT public/anon → service_role only via API routes (POST request,
-- pas d'accès direct depuis le navigateur — éviter spam)

-- ============================================
-- vouchers : étendre source pour 'gift'
-- ============================================

ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_source_check;
ALTER TABLE vouchers ADD CONSTRAINT vouchers_source_check
  CHECK (source IN ('birthday', 'referral', 'redemption', 'welcome', 'offer', 'gift'));
