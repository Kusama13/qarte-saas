-- Performance Indexes v2 — Scalability audit
-- 4 index manquants identifiés sur les requêtes les plus fréquentes
-- À exécuter dans Supabase SQL Editor

-- 1. Historique client (page carte fidélité — tri par date)
CREATE INDEX IF NOT EXISTS idx_visits_customer_visited
ON visits(customer_id, visited_at DESC);

-- 2. Lookup parrainage (scan avec ?ref=)
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_referral_code
ON loyalty_cards(referral_code)
WHERE referral_code IS NOT NULL;

-- 3. Vérification récompenses (paliers, historique redemptions)
CREATE INDEX IF NOT EXISTS idx_redemptions_card_tier_date
ON redemptions(loyalty_card_id, tier, redeemed_at DESC);

-- 4. Vouchers client (page carte — lookup cadeaux par client+merchant)
CREATE INDEX IF NOT EXISTS idx_vouchers_customer_merchant
ON vouchers(customer_id, merchant_id);

-- Déjà existants (ne pas recréer) :
-- idx_banned_numbers_merchant_phone (migration 004)
-- pending_email_tracking(merchant_id, reminder_day) + UNIQUE (migration 005)

-- Refresh stats pour le query planner
ANALYZE visits;
ANALYZE loyalty_cards;
ANALYZE redemptions;
ANALYZE vouchers;
