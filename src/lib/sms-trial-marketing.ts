import type { SupabaseClient } from '@supabase/supabase-js';
import { sendSms } from './ovh-sms';
import { isLegalSendTime } from './sms-compliance';
import { SMS_UNIT_COST } from './sms-constants';
import { isEligibleForTrialMarketing } from './trial-marketing-cutoff';
import logger from './logger';
import type { Pillar } from './activation-score';

/**
 * SMS marketing trial (plan v2 emails+SMS) — helper d'envoi centralisé.
 * Voir docs/email-sms-trial-plan.md §5.
 *
 * Gère : gating (opt-out, no_contact, unsubscribed, plage légale),
 * dedup (par type pour celebration/pre-loss/churn), log en DB.
 */

export type TrialSmsType =
  | 'celebration_fidelity'
  | 'celebration_planning'
  | 'celebration_vitrine'
  | 'trial_pre_loss'
  | 'churn_survey';

export type TierRecommended = 'fidelity' | 'all_in' | null;

interface MerchantGatingInfo {
  id: string;
  phone: string;
  country: string;
  created_at: string;
  no_contact: boolean;
  email_unsubscribed_at: string | null;
  marketing_sms_opted_out: boolean;
  celebration_sms_sent_at: string | null;
  pre_loss_sms_sent_at: string | null;
  churn_sms_sent_at: string | null;
}

interface SendResult {
  success: boolean;
  skipped?: 'opted_out' | 'no_contact' | 'unsubscribed' | 'already_sent' | 'illegal_time' | 'invalid_phone' | 'pre_cutoff';
  error?: string;
  logId?: string;
}

/**
 * Vérifie les règles de gating communes à tous les SMS trial marketing.
 * Retourne null si OK, sinon la raison du skip.
 */
export function checkTrialSmsGating(
  merchant: MerchantGatingInfo,
  smsType: TrialSmsType,
  now: Date = new Date(),
): SendResult['skipped'] | null {
  // Cutoff date : seuls les merchants créés à partir du 2026-04-20 sont éligibles
  // (garantie contre les envois rétroactifs, voir incident 20 avril 2026)
  if (!isEligibleForTrialMarketing(merchant.created_at)) return 'pre_cutoff';

  if (merchant.no_contact) return 'no_contact';
  if (merchant.email_unsubscribed_at) return 'unsubscribed';
  if (merchant.marketing_sms_opted_out) return 'opted_out';
  if (!merchant.phone || merchant.phone.length < 8) return 'invalid_phone';

  // Dedup par type via flag column (atomique, pas de log-check approximatif)
  if (smsType.startsWith('celebration_') && merchant.celebration_sms_sent_at) return 'already_sent';
  if (smsType === 'trial_pre_loss' && merchant.pre_loss_sms_sent_at) return 'already_sent';
  if (smsType === 'churn_survey' && merchant.churn_sms_sent_at) return 'already_sent';

  const compliance = isLegalSendTime(now, merchant.country || 'FR');
  if (!compliance.ok) return 'illegal_time';

  return null;
}

export function celebrationTypeFromPillar(pillar: Pillar): TrialSmsType {
  if (pillar === 'fidelity') return 'celebration_fidelity';
  if (pillar === 'planning') return 'celebration_planning';
  return 'celebration_vitrine';
}

/**
 * Envoie un SMS marketing trial. Gère gating + OVH + logging.
 * Fire-and-forget : ne throw jamais, log les erreurs.
 */
export async function sendTrialMarketingSms(params: {
  supabase: SupabaseClient;
  merchant: MerchantGatingInfo;
  smsType: TrialSmsType;
  body: string;
  stateSnapshot?: number;
  tierRecommended?: TierRecommended;
}): Promise<SendResult> {
  const { supabase, merchant, smsType, body, stateSnapshot, tierRecommended } = params;

  // 1. Gating
  const skipReason = checkTrialSmsGating(merchant, smsType);
  if (skipReason) {
    logger.info('trial_sms_skipped', { merchantId: merchant.id, smsType, reason: skipReason });
    return { success: false, skipped: skipReason };
  }

  // 2. Envoi OVH
  const result = await sendSms(merchant.phone, body);

  // 3. Log (même si échec OVH — on garde trace)
  const logRow = {
    merchant_id: merchant.id,
    sms_type: smsType,
    state_snapshot: stateSnapshot ?? null,
    tier_recommended: tierRecommended ?? null,
    body,
    ovh_job_id: result.jobId ?? null,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error ?? null,
    cost_euro: result.success ? SMS_UNIT_COST : null,
  };

  const { data: logData, error: logError } = await supabase
    .from('merchant_marketing_sms_logs')
    .insert(logRow)
    .select('id')
    .single();

  if (logError) {
    logger.error('trial_sms_log_failed', { merchantId: merchant.id, smsType, error: logError });
  }

  // 4. Dedup : marker le flag correspondant dès que l'envoi OVH a réussi
  if (result.success) {
    const nowIso = new Date().toISOString();
    const updates: Record<string, string> = {};
    if (smsType.startsWith('celebration_')) updates.celebration_sms_sent_at = nowIso;
    else if (smsType === 'trial_pre_loss') updates.pre_loss_sms_sent_at = nowIso;
    else if (smsType === 'churn_survey') updates.churn_sms_sent_at = nowIso;

    if (Object.keys(updates).length > 0) {
      await supabase.from('merchants').update(updates).eq('id', merchant.id);
    }
  }

  return {
    success: result.success,
    error: result.error,
    logId: logData?.id,
  };
}

/**
 * Vérifie si un SMS de ce type a déjà été envoyé à ce merchant (dedup).
 * Utile pour pre-loss + churn (dédup par type, pas de marker sur merchants).
 */
export async function hasSentTrialSms(
  supabase: SupabaseClient,
  merchantId: string,
  smsType: TrialSmsType,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('merchant_marketing_sms_logs')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('sms_type', smsType)
    .eq('status', 'sent')
    .limit(1);

  if (error) {
    logger.error('hasSentTrialSms_failed', { merchantId, smsType, error });
    return true;
  }

  return (data?.length ?? 0) > 0;
}
