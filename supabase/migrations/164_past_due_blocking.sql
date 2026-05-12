-- Mig 164 — Blocage merchants past_due apres 72h
-- ════════════════════════════════════════════════════════════════════════
-- Ajoute une colonne `past_due_since` set par le webhook Stripe a la
-- transition active→past_due, reset NULL sur invoice.payment_succeeded.
--
-- Sert de source de verite temporelle :
--   - Blocage dashboard + scans clientes apres 72h (helper isMerchantBlocked)
--   - Cron morning utilise cette colonne pour les emails dunning (J+3/J+7/J+10)
--     au lieu de `updated_at` (qui se reset a chaque modif merchant — bypass
--     trivial via toggle settings).
--
-- Idempotent (IF NOT EXISTS / DROP IF EXISTS). Safe a relancer.

-- ─── 1. Colonne past_due_since ──────────────────────────────────────────
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ;

COMMENT ON COLUMN merchants.past_due_since IS
  'Timestamp transition active→past_due (Stripe webhook invoice.payment_failed). NULL = pas past_due OU reset par invoice.payment_succeeded. Source de verite pour le blocage 72h (dashboard + scans) ET pour les emails dunning J+3/J+7/J+10 — independant de updated_at qui peut etre reset par toute modif merchant.';

-- ─── 2. Backfill : bloque immediatement les past_due > 72h ─────────────
-- Decision produit (mai 2026, "trop d'impayes") : appliquer la regle 72h aux
-- past_due actuels. Les merchants en past_due depuis plus de 72h sont bloques
-- des l'application de la mig ; les recents (<72h) gardent leur grace.
--
-- Source la plus fiable : COALESCE(past_due_sms1_sent_at, updated_at).
--   - past_due_sms1_sent_at (mig 163) : pose par le webhook a la transition
--     active→past_due, jamais reset par toggle settings → fiable.
--   - updated_at : fallback pour les past_due anterieurs a mig 163 (pas
--     parfait, toggle settings reset, mais seul signal dispo).
--
-- Filtre : seuls ceux dont l'estimation est > 72h passent en blocage. Les
-- recents passeront par le flow webhook normal (past_due_since = NOW() pose
-- par invoice.payment_failed quand Stripe re-tentera).
UPDATE merchants
SET past_due_since = COALESCE(past_due_sms1_sent_at, updated_at)
WHERE subscription_status = 'past_due'
  AND past_due_since IS NULL
  AND COALESCE(past_due_sms1_sent_at, updated_at) < NOW() - INTERVAL '72 hours';

-- ─── 3. Index partiel ───────────────────────────────────────────────────
-- Sert au cron morning pour scanner rapidement les past_due actifs.
CREATE INDEX IF NOT EXISTS idx_merchants_past_due_since
  ON merchants(past_due_since)
  WHERE subscription_status = 'past_due'
    AND past_due_since IS NOT NULL;
