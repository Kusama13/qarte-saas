-- 140 — gift cards : mode "offrir une prestation"
--
-- Le client peut offrir un montant (mode actuel) OU une/plusieurs prestations
-- du salon. Les services_ids sont snapshotés à la commande pour résilience
-- (suppression service après commande), mais l'affichage prend le LIVE en
-- priorité (depuis merchant_services). Le montant payé est figé : il
-- correspond à la somme des prix au moment de la commande.

-- ============================================
-- merchants : sous-toggle pour autoriser le mode services
-- ============================================

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS gift_card_services_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN merchants.gift_card_services_enabled IS
  'Autorise le client à offrir une prestation (en plus du montant libre). Default true.';

-- ============================================
-- gift_cards : kind + service_ids + snapshot
-- ============================================

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'amount'
    CHECK (kind IN ('amount', 'services'));

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS service_ids JSONB;

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS service_snapshot JSONB;

COMMENT ON COLUMN gift_cards.kind IS
  'amount = montant libre (default), services = liste de prestations offertes';
COMMENT ON COLUMN gift_cards.service_ids IS
  'Array UUIDs des merchant_services choisis (kind=services). Référence dynamique.';
COMMENT ON COLUMN gift_cards.service_snapshot IS
  'Array [{id,name,price}] capturé à la commande. Fallback si service supprimé/renommé.';

-- Garde-fou : si kind=services, service_ids non vide
DO $$ BEGIN
  ALTER TABLE gift_cards ADD CONSTRAINT gift_cards_services_consistency
    CHECK (
      kind = 'amount'
      OR (kind = 'services' AND service_ids IS NOT NULL AND jsonb_array_length(service_ids) > 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
