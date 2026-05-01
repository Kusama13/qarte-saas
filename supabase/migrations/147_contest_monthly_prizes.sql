-- 147 — concours : lot planifiable par mois
--
-- Permet au merchant de planifier différents lots à l'avance (avril = coffret,
-- mai = bon 30€, juin = ...). La table `merchant_contest_prizes` est une
-- override mensuelle ; `merchants.contest_prize` reste comme fallback pour
-- les merchants qui n'utilisent pas la planification.
--
-- Le cron `monthly-contest` lit prize via la table en priorité, fallback
-- sur `merchants.contest_prize`.
--
-- + une colonne pour tracer l'envoi du rappel "lot du mois pas défini" (push +
-- email envoyé dans les 5 derniers jours du mois si aucun prix n'est dispo).
-- Resetée chaque mois par le cron lui-même via comparaison de la date.

CREATE TABLE IF NOT EXISTS merchant_contest_prizes (
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  contest_month VARCHAR(7) NOT NULL,
  prize_description TEXT NOT NULL CHECK (length(prize_description) > 0 AND length(prize_description) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (merchant_id, contest_month)
);

COMMENT ON TABLE merchant_contest_prizes IS
  'Override mensuel du lot du concours. Le cron monthly-contest lit ici en priorité, fallback merchants.contest_prize. Format month = YYYY-MM (timezone merchant).';

-- Trigger updated_at (réutilise la fonction existante)
DROP TRIGGER IF EXISTS update_merchant_contest_prizes_updated_at ON merchant_contest_prizes;
CREATE TRIGGER update_merchant_contest_prizes_updated_at
  BEFORE UPDATE ON merchant_contest_prizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS : merchant SELECT/INSERT/UPDATE/DELETE own
ALTER TABLE merchant_contest_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchant manage own contest prizes" ON merchant_contest_prizes;
CREATE POLICY "Merchant manage own contest prizes"
  ON merchant_contest_prizes FOR ALL
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );

-- Colonne pour tracer le rappel "lot manquant"
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS contest_missing_prize_alerted_at TIMESTAMPTZ;

COMMENT ON COLUMN merchants.contest_missing_prize_alerted_at IS
  'Timestamp du dernier push+email envoyé au merchant pour lui rappeler de définir le lot du concours. Le cron compare avec le mois courant pour ne pas spammer (max 1 alerte par mois).';
