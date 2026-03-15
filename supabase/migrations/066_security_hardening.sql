-- ============================================================
-- Migration 066: Security hardening
-- Fixes: open RLS policies, missing service_role policies,
--        SECURITY DEFINER search_path, storage scoping
-- ============================================================

-- ── C1 + C2: Fix push_automations — drop open policies, add proper ones ──

DROP POLICY IF EXISTS "Merchants can view own automations" ON push_automations;
DROP POLICY IF EXISTS "Merchants can update own automations" ON push_automations;
DROP POLICY IF EXISTS "Service role full access automations" ON push_automations;

CREATE POLICY "Service role full access push_automations"
  ON push_automations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Merchants can view own automations"
  ON push_automations FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can update own automations"
  ON push_automations FOR UPDATE
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- ── Fix push_automation_logs — same issue ──

DROP POLICY IF EXISTS "Service role full access logs" ON push_automation_logs;

CREATE POLICY "Service role full access push_automation_logs"
  ON push_automation_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── H1: Add search_path to SECURITY DEFINER functions ──

DROP FUNCTION IF EXISTS generate_slug(text);
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  IF base_slug = '' THEN base_slug := 'salon'; END IF;
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM merchants WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN new_slug;
END;
$$;

DROP FUNCTION IF EXISTS generate_scan_code();
CREATE OR REPLACE FUNCTION generate_scan_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  LOOP
    new_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM merchants WHERE scan_code = new_code);
  END LOOP;
  RETURN new_code;
END;
$$;

DROP FUNCTION IF EXISTS increment_offer_claim(uuid);
CREATE OR REPLACE FUNCTION increment_offer_claim(p_offer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INT;
  v_current INT;
BEGIN
  SELECT max_claims, claim_count INTO v_max, v_current
  FROM merchant_offers WHERE id = p_offer_id AND active = true;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_max IS NOT NULL AND v_current >= v_max THEN RETURN FALSE; END IF;

  UPDATE merchant_offers SET claim_count = claim_count + 1 WHERE id = p_offer_id;
  RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS increment_push_automation_stat(uuid, text);
CREATE OR REPLACE FUNCTION increment_push_automation_stat(
  p_merchant_id UUID,
  p_column_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE FORMAT(
    'UPDATE push_automations SET %I = COALESCE(%I, 0) + 1 WHERE merchant_id = $1',
    p_column_name, p_column_name
  ) USING p_merchant_id;
END;
$$;

-- ── H2: Add explicit service_role policies to newer tables ──

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_photos' AND policyname = 'Service role full access merchant_photos') THEN
    CREATE POLICY "Service role full access merchant_photos"
      ON merchant_photos FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_services' AND policyname = 'Service role full access merchant_services') THEN
    CREATE POLICY "Service role full access merchant_services"
      ON merchant_services FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_service_categories' AND policyname = 'Service role full access merchant_service_categories') THEN
    CREATE POLICY "Service role full access merchant_service_categories"
      ON merchant_service_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_offers' AND policyname = 'Service role full access merchant_offers') THEN
    CREATE POLICY "Service role full access merchant_offers"
      ON merchant_offers FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchant_planning_slots' AND policyname = 'Service role full access merchant_planning_slots') THEN
    CREATE POLICY "Service role full access merchant_planning_slots"
      ON merchant_planning_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_snapshots' AND policyname = 'Service role full access revenue_snapshots') THEN
    CREATE POLICY "Service role full access revenue_snapshots"
      ON revenue_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── H3: Add service_role policies to tracking tables with zero policies ──

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reactivation_email_tracking' AND policyname = 'Service role full access reactivation_email_tracking') THEN
    CREATE POLICY "Service role full access reactivation_email_tracking"
      ON reactivation_email_tracking FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_email_tracking' AND policyname = 'Service role full access pending_email_tracking') THEN
    CREATE POLICY "Service role full access pending_email_tracking"
      ON pending_email_tracking FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── H4: Scope storage policies to merchant's own files ──
-- Current: any authenticated user can modify any file
-- Fix: scope INSERT/UPDATE/DELETE to files in user's own folder

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Authenticated users can upload own images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can update own images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can delete own images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Keep public read (logos need to be visible)
-- The existing "Public read images" policy should already handle this

-- ── H5: Add SELECT policy for contact_messages (admin read) ──

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Service role full access contact_messages') THEN
    CREATE POLICY "Service role full access contact_messages"
      ON contact_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── M4: Add updated_at trigger on prospects ──

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_prospects_updated_at') THEN
    CREATE TRIGGER set_prospects_updated_at
      BEFORE UPDATE ON prospects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
