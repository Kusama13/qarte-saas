-- 137 — attendance auto-check
--
-- Marquer en bulk attendance_status = 'attended' sur les slots passés en
-- pending est trop lourd à demander au merchant. On va auto-marker via
-- cron morning-jobs. Cette colonne suit la dernière fois où le merchant
-- a "validé" la journée passée via le soft-prompt dashboard.
--
-- - NULL ou < startOfTodayLocal = on affiche le prompt pour la journée
--   hier (si elle avait des résas)
-- - = NOW() après que le merchant a cliqué "Tout bon" ou flippé une
--   absence

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS last_attendance_check_at TIMESTAMPTZ;

COMMENT ON COLUMN merchants.last_attendance_check_at IS
  'Dernière fois que le merchant a validé/dismissé le prompt attendance check (soft-prompt dashboard).';
