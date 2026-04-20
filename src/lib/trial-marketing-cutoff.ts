/**
 * Cutoff date — seuls les merchants créés à partir de cette date reçoivent
 * les SMS marketing trial (célébration, pre-loss J-1, churn survey).
 *
 * Incident du 2026-04-20 : le cron a envoyé le SMS célébration à TOUS les
 * merchants existants car aucune protection par created_at n'existait. Ce
 * cutoff est la garantie principale ; la migration 122 backfille aussi les
 * flags dedup pour défense en profondeur.
 *
 * NE PAS reculer cette date sans backfill manuel des flags concernés
 * (celebration_sms_sent_at, pre_loss_sms_sent_at, churn_sms_sent_at) pour
 * tous les merchants créés après la nouvelle cutoff.
 */
export const TRIAL_MARKETING_CUTOFF = new Date('2026-04-20T00:00:00Z');

export function isEligibleForTrialMarketing(createdAt: string | Date | null | undefined): boolean {
  if (!createdAt) return false;
  const dt = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return dt.getTime() >= TRIAL_MARKETING_CUTOFF.getTime();
}
