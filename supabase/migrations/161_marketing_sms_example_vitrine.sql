-- Mig 161 — Catch-up consolide : 146 + 147 + 149 + fix CHECK marketing_sms_logs
-- ════════════════════════════════════════════════════════════════════════
-- Migrations manquantes en prod identifiees via introspection 2026-05-07 :
--   - 146 : gift_cards.expiry_reminder_sent_at + index partiel
--   - 147 : merchant_contest_prizes table + RLS + colonne contest_missing_prize_alerted_at
--   - 149 : RPC merchant_milestone_stats avec booking_count online-only
--   - 161 : CHECK merchant_marketing_sms_logs.sms_type aligne avec TrialSmsType (8 types)
--
-- Tout est idempotent (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
-- Safe a relancer.

-- ─── 146 — Gift cards : rappel SMS J-7 avant expiration ─────────────────
ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN gift_cards.expiry_reminder_sent_at IS
  'Date d''envoi du SMS de rappel J-7 au destinataire. NULL = pas encore envoye. Pose une seule fois par le cron gift-cards-expire.';

CREATE INDEX IF NOT EXISTS idx_gift_cards_active_no_reminder
  ON gift_cards (expires_at)
  WHERE status = 'active' AND expiry_reminder_sent_at IS NULL;


-- ─── 147 — Concours : lot planifiable par mois ──────────────────────────
CREATE TABLE IF NOT EXISTS merchant_contest_prizes (
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  contest_month VARCHAR(7) NOT NULL,
  prize_description TEXT NOT NULL CHECK (length(prize_description) > 0 AND length(prize_description) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (merchant_id, contest_month)
);

COMMENT ON TABLE merchant_contest_prizes IS
  'Override mensuel du lot du concours. Cron monthly-contest lit ici en priorite, fallback merchants.contest_prize. Format month = YYYY-MM (timezone merchant).';

DROP TRIGGER IF EXISTS update_merchant_contest_prizes_updated_at ON merchant_contest_prizes;
CREATE TRIGGER update_merchant_contest_prizes_updated_at
  BEFORE UPDATE ON merchant_contest_prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE merchant_contest_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchant manage own contest prizes" ON merchant_contest_prizes;
CREATE POLICY "Merchant manage own contest prizes"
  ON merchant_contest_prizes FOR ALL
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  )
  WITH CHECK (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
  );

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS contest_missing_prize_alerted_at TIMESTAMPTZ;

COMMENT ON COLUMN merchants.contest_missing_prize_alerted_at IS
  'Timestamp du dernier push+email rappel "lot manquant". Cron compare avec le mois courant (max 1 alerte/mois).';


-- ─── 149 — RPC merchant_milestone_stats : booking_count online-only ─────
CREATE OR REPLACE FUNCTION merchant_milestone_stats(merchant_ids uuid[])
RETURNS TABLE (
  merchant_id uuid,
  confirmed_visit_count bigint,
  last_confirmed_visit_at timestamptz,
  pending_visit_count bigint,
  oldest_pending_visit_at timestamptz,
  booking_count bigint,
  total_rewards_earned bigint,
  unique_customer_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS merchant_id,
    COALESCE(v_conf.cnt, 0)             AS confirmed_visit_count,
    v_conf.last_at                      AS last_confirmed_visit_at,
    COALESCE(v_pend.cnt, 0)             AS pending_visit_count,
    v_pend.oldest_at                    AS oldest_pending_visit_at,
    COALESCE(b.cnt, 0)                  AS booking_count,
    COALESCE(r.total, 0)                AS total_rewards_earned,
    COALESCE(c.cnt, 0)                  AS unique_customer_count
  FROM unnest(merchant_ids) AS m(id)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt, MAX(visited_at) AS last_at
    FROM visits
    WHERE merchant_id = m.id AND status = 'confirmed'
  ) v_conf ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt, MIN(visited_at) AS oldest_at
    FROM visits
    WHERE merchant_id = m.id AND status = 'pending'
  ) v_pend ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM merchant_planning_slots
    WHERE merchant_id = m.id
      AND client_name IS NOT NULL
      AND client_name <> '__blocked__'
      AND booked_online = true
  ) b ON TRUE
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(rewards_earned), 0)::bigint AS total
    FROM loyalty_cards
    WHERE merchant_id = m.id AND rewards_earned > 0
  ) r ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT customer_id)::bigint AS cnt
    FROM loyalty_cards
    WHERE merchant_id = m.id
  ) c ON TRUE;
$$;

GRANT EXECUTE ON FUNCTION merchant_milestone_stats(uuid[]) TO service_role;

COMMENT ON FUNCTION merchant_milestone_stats IS
  'booking_count filtre desormais sur booked_online=true (vs saisies manuelles dashboard). Voir mig 133 + 149.';


-- ─── 161 — CHECK marketing_sms_logs aligne avec TrialSmsType (8 types) ──
-- TrialSmsType source-of-truth : src/lib/sms-trial-marketing.ts:16-24
-- checkin_nudge + checkin_combo etaient en code + DB (36 rows) mais absents
-- de la CHECK depuis le debut. example_vitrine ajoute par mig 158 cote code
-- mais oublie cote contrainte. Tout aligne maintenant.
ALTER TABLE merchant_marketing_sms_logs
  DROP CONSTRAINT IF EXISTS merchant_marketing_sms_logs_sms_type_check;

ALTER TABLE merchant_marketing_sms_logs
  ADD CONSTRAINT merchant_marketing_sms_logs_sms_type_check
  CHECK (sms_type IN (
    'celebration_fidelity',
    'celebration_planning',
    'celebration_vitrine',
    'checkin_nudge',
    'checkin_combo',
    'trial_pre_loss',
    'churn_survey',
    'example_vitrine'
  ));
