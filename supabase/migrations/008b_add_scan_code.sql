-- Migration: Ajouter la colonne scan_code aux merchants
-- Cette migration ajoute un code de scan unique pour chaque marchand
-- au lieu d'utiliser le slug facilement devinable

-- 1. Ajouter la colonne scan_code si elle n'existe pas
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS scan_code VARCHAR(8);

-- 2. Fonction pour generer un code de scan aleatoire
-- Exclut les caracteres confus: 0, O, I, l, 1
CREATE OR REPLACE FUNCTION generate_scan_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Generer des codes uniques pour tous les merchants existants sans scan_code
DO $$
DECLARE
  merchant_record RECORD;
  new_code VARCHAR(8);
  code_exists BOOLEAN;
BEGIN
  FOR merchant_record IN SELECT id FROM merchants WHERE scan_code IS NULL LOOP
    LOOP
      new_code := generate_scan_code();
      SELECT EXISTS(SELECT 1 FROM merchants WHERE scan_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    UPDATE merchants SET scan_code = new_code WHERE id = merchant_record.id;
  END LOOP;
END;
$$;

-- 4. Rendre la colonne NOT NULL apres avoir rempli toutes les valeurs
ALTER TABLE merchants
ALTER COLUMN scan_code SET NOT NULL;

-- 5. Ajouter une contrainte d'unicite
ALTER TABLE merchants
ADD CONSTRAINT merchants_scan_code_unique UNIQUE (scan_code);

-- 6. Creer un index pour les recherches par scan_code
CREATE INDEX IF NOT EXISTS idx_merchants_scan_code ON merchants(scan_code);

-- Verification
SELECT id, shop_name, slug, scan_code FROM merchants;
