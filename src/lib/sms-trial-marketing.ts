import type { SupabaseClient } from '@supabase/supabase-js';
import { sendSms } from './ovh-sms';
import { isLegalSendTime } from './sms-compliance';
import { SMS_UNIT_COST } from './sms-constants';
import { isEligibleForTrialMarketing } from './trial-marketing-cutoff';
import logger from './logger';

/**
 * SMS marketing trial (plan v2 emails+SMS) — helper d'envoi centralisé.
 * Voir docs/email-sms-trial-plan.md §5.
 *
 * Gère : gating (opt-out, no_contact, unsubscribed, plage légale),
 * dedup (par type pour celebration/pre-loss/churn), log en DB.
 */

export type TrialSmsType =
  | 'celebration_fidelity'   // check-in 48h variante B (fidélité seule)
  | 'celebration_planning'   // fallback rare (planning seul)
  | 'celebration_vitrine'    // check-in 48h variante C (vitrine seule)
  | 'checkin_nudge'          // check-in 48h variante A (rien configuré)
  | 'checkin_combo'          // check-in 48h variante D (2+ piliers)
  | 'trial_pre_loss'
  | 'churn_survey';

export type TierRecommended = 'fidelity' | 'all_in' | null;

type DedupFlagColumn = 'celebration_sms_sent_at' | 'pre_loss_sms_sent_at' | 'churn_sms_sent_at';

/** Mapping total vers la colonne de dédup. TS garantit l'exhaustivité si un
 *  nouveau TrialSmsType est ajouté → compile-time safety. Les 5 variantes du
 *  check-in 48h partagent celebration_sms_sent_at (1 SMS max sur la vie). */
const DEDUP_FLAG: Record<TrialSmsType, DedupFlagColumn> = {
  celebration_fidelity: 'celebration_sms_sent_at',
  celebration_planning: 'celebration_sms_sent_at',
  celebration_vitrine: 'celebration_sms_sent_at',
  checkin_nudge: 'celebration_sms_sent_at',
  checkin_combo: 'celebration_sms_sent_at',
  trial_pre_loss: 'pre_loss_sms_sent_at',
  churn_survey: 'churn_sms_sent_at',
};

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
  if (!isEligibleForTrialMarketing(merchant.created_at)) return 'pre_cutoff';
  if (merchant.no_contact) return 'no_contact';
  if (merchant.email_unsubscribed_at) return 'unsubscribed';
  if (merchant.marketing_sms_opted_out) return 'opted_out';
  if (!merchant.phone || merchant.phone.length < 8) return 'invalid_phone';
  if (merchant[DEDUP_FLAG[smsType]]) return 'already_sent';

  const compliance = isLegalSendTime(now, merchant.country || 'FR');
  if (!compliance.ok) return 'illegal_time';

  return null;
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

  // 4. Dedup : marker le flag correspondant (atomique via lookup DEDUP_FLAG)
  if (result.success) {
    await supabase
      .from('merchants')
      .update({ [DEDUP_FLAG[smsType]]: new Date().toISOString() })
      .eq('id', merchant.id);
  }

  return {
    success: result.success,
    error: result.error,
    logId: logData?.id,
  };
}

