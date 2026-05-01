-- Migration 098: Contraintes scalabilite (audit avril 2026)
-- Appliquer dans Supabase SQL Editor

-- =============================================
-- H2. TEXT length constraints
-- =============================================
ALTER TABLE merchants ADD CONSTRAINT chk_shop_name_length CHECK (LENGTH(shop_name) <= 255);
ALTER TABLE merchants ADD CONSTRAINT chk_reward_desc_length CHECK (LENGTH(reward_description) <= 1000);
ALTER TABLE merchants ADD CONSTRAINT chk_welcome_message_length CHECK (LENGTH(welcome_message) <= 2000);
ALTER TABLE merchants ADD CONSTRAINT chk_promo_message_length CHECK (LENGTH(promo_message) <= 2000);
ALTER TABLE merchants ADD CONSTRAINT chk_bio_length CHECK (LENGTH(bio) <= 2000);
ALTER TABLE merchants ADD CONSTRAINT chk_booking_message_length CHECK (LENGTH(booking_message) <= 2000);
ALTER TABLE customers ADD CONSTRAINT chk_first_name_length CHECK (LENGTH(first_name) <= 100);
ALTER TABLE customers ADD CONSTRAINT chk_last_name_length CHECK (LENGTH(last_name) <= 100);
ALTER TABLE vouchers ADD CONSTRAINT chk_voucher_reward_desc_length CHECK (LENGTH(reward_description) <= 1000);
ALTER TABLE point_adjustments ADD CONSTRAINT chk_reason_length CHECK (LENGTH(reason) <= 500);
ALTER TABLE merchant_planning_slots ADD CONSTRAINT chk_notes_length CHECK (LENGTH(notes) <= 2000);

-- =============================================
-- H3. RLS sur admin_tasks et admin_notes
-- =============================================
-- ENABLE est idempotent (pas d'erreur si deja active)
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- DROP IF EXISTS pour eviter erreur si la policy existe deja
DROP POLICY IF EXISTS admin_tasks_super_admin ON admin_tasks;
CREATE POLICY admin_tasks_super_admin ON admin_tasks
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM super_admins));

DROP POLICY IF EXISTS admin_notes_super_admin ON admin_notes;
CREATE POLICY admin_notes_super_admin ON admin_notes
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM super_admins));

-- Le service_role bypass RLS par defaut (pas besoin de policy)

-- =============================================
-- H4. Deposit percent/amount mutuellement exclusifs
-- =============================================
ALTER TABLE merchants ADD CONSTRAINT chk_deposit_exclusivity
  CHECK (deposit_percent IS NULL OR deposit_amount IS NULL);

-- =============================================
-- H12. Composite indexes pour queries frequentes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_merchant_created
  ON loyalty_cards(merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_point_adjustments_merchant_adjusted
  ON point_adjustments(merchant_id, adjusted_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_merchant_visited
  ON visits(merchant_id, visited_at DESC);

-- =============================================
-- H16. UNIQUE constraint push dedup
-- =============================================
-- Empeche les push notifs en double pour le meme event
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_push_logs_dedup
  ON merchant_push_logs(merchant_id, notification_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- =============================================
-- C8. UNIQUE constraint cron email dedup
-- =============================================
-- pending_email_tracking a deja un UNIQUE(merchant_id, reminder_day)
-- Pas besoin d'index supplementaire

-- M5. Index pour lookup frequent dans les crons
CREATE INDEX IF NOT EXISTS idx_reactivation_email_tracking_lookup
  ON reactivation_email_tracking(merchant_id, day_sent);
