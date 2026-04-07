-- Trigger BEFORE DELETE sur merchants : empeche les suppressions accidentelles
-- Un DELETE sur un merchant actif (deleted_at IS NULL) est BLOQUE → force le soft-delete
-- Un DELETE sur un merchant deja soft-deleted (deleted_at IS NOT NULL) est AUTORISE → purge volontaire

CREATE OR REPLACE FUNCTION prevent_merchant_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Hard delete bloque. Utilisez UPDATE SET deleted_at = NOW() pour soft-delete. Pour forcer, soft-delete d''abord puis re-DELETE.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_merchant_hard_delete
  BEFORE DELETE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION prevent_merchant_hard_delete();
