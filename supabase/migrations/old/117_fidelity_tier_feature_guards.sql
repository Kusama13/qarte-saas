-- Tier gating DB level : empêche un merchant Fidélité d'activer les features
-- gated (planning, contest, memberPrograms via tier2).
--
-- Pourquoi DB-level : les toggles UI passent par supabase.from('merchants').update()
-- direct via client (pas d'API route), donc RLS applique mais peut laisser passer.
-- Trigger BEFORE UPDATE force les flags à FALSE si plan_tier='fidelity'.
--
-- Voir docs/email-sms-trial-plan.md §4 + plan_tiers.ts

CREATE OR REPLACE FUNCTION enforce_fidelity_tier_feature_guards()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_tier = 'fidelity' THEN
    -- Planning (module complet : résa en ligne + agenda)
    NEW.planning_enabled := FALSE;
    NEW.auto_booking_enabled := FALSE;

    -- Contest (jeu concours mensuel — plan v2 feature gated)
    NEW.contest_enabled := FALSE;

    -- Tier 2 cagnotte (reste accessible car feature fidélité, mais Member Programs ≠ tier 2)
    -- memberPrograms est géré par table member_programs, pas de flag sur merchants
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fidelity_tier_feature_guards ON merchants;
CREATE TRIGGER trg_fidelity_tier_feature_guards
  BEFORE INSERT OR UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION enforce_fidelity_tier_feature_guards();

-- Backfill : merchants actuellement Fidélité avec flags activés sont reset
UPDATE merchants
SET
  planning_enabled = FALSE,
  auto_booking_enabled = FALSE,
  contest_enabled = FALSE
WHERE plan_tier = 'fidelity'
  AND (planning_enabled = TRUE OR auto_booking_enabled = TRUE OR contest_enabled = TRUE);

COMMENT ON FUNCTION enforce_fidelity_tier_feature_guards() IS
  'Bloque l''activation des features gated (planning, contest) pour les merchants plan_tier=fidelity. Voir plan_tiers.ts.';
