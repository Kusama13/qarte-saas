import type { SupabaseClient } from '@supabase/supabase-js';
import { sendSms } from './ovh-sms';
import { sendSmsPartner } from './sms-partner';
import { detectPhoneCountry } from './utils';
import { isPhoneBlacklisted } from './sms-blacklist';
import { SMS_UNIT_COST } from './sms-constants';
import logger from './logger';

/**
 * SMS dunning past_due (mig 163).
 * - Step 1 (J0)  : envoye par Stripe webhook invoice.payment_failed
 * - Step 2 (J+2) : envoye par cron morning si toujours past_due
 *
 * Caractere transactionnel critique (info compte) → on ne respecte PAS
 * marketing_sms_opted_out, seulement no_contact (full opt-out).
 *
 * Anti-doublon : UPDATE conditional WHERE past_due_smsN_sent_at IS NULL.
 * Seul le worker qui gagne l'UPDATE atomique envoie le SMS.
 */

export type PastDueSmsStep = 1 | 2;

interface MerchantInfo {
  id: string;
  shop_name: string | null;
  phone: string | null;
  country: string | null;
  no_contact: boolean | null;
  deleted_at: string | null;
  subscription_status: string | null;
  past_due_sms1_sent_at: string | null;
  past_due_sms2_sent_at: string | null;
}

interface SendResult {
  success: boolean;
  skipped?: 'no_contact' | 'invalid_phone' | 'blacklisted' | 'not_past_due' | 'soft_deleted' | 'already_sent' | 'no_sms1_yet' | 'send_failed';
  error?: string;
}

const SMS_PARTNER_ENABLED = (process.env.SMS_PARTNER_ENABLED || '').trim().toLowerCase() === 'true';

function selectProvider(phone: string): 'ovh' | 'sms_partner' {
  if (!SMS_PARTNER_ENABLED) return 'ovh';
  const country = detectPhoneCountry(phone);
  return (country === 'FR' || country === 'BE') ? 'sms_partner' : 'ovh';
}

/**
 * Compose le corps du SMS selon le step. < 160 chars GSM-7.
 * Vouvoyer non — on tutoie le merchant (cohérent dashboard).
 * Pas de mention STOP : transactionnel (info compte critique).
 */
function buildBody(step: PastDueSmsStep): string {
  const link = 'https://getqarte.com/dashboard/subscription';
  if (step === 1) {
    return `Qarte: ton paiement vient d'echouer. Mets a jour ta carte pour ne pas perdre tes donnees: ${link}`;
  }
  return `Qarte: paiement toujours en attente. Regularise pour ne pas perdre tes donnees: ${link}`;
}

/**
 * Envoi atomique d'un SMS dunning past_due. Re-verifie tous les guards
 * a chaque appel (race conditions webhook/cron OK).
 *
 * Returns success=true si SMS envoye + flag pose. skipped=raison sinon.
 * Fire-and-forget : ne throw jamais.
 */
export async function sendPastDueSms(params: {
  supabase: SupabaseClient;
  merchant: MerchantInfo;
  step: PastDueSmsStep;
}): Promise<SendResult> {
  const { supabase, merchant, step } = params;

  // ── Guards merchant ────────────────────────────────────────────────────
  if (merchant.deleted_at) return { success: false, skipped: 'soft_deleted' };
  if (merchant.no_contact) return { success: false, skipped: 'no_contact' };
  if (merchant.subscription_status !== 'past_due') return { success: false, skipped: 'not_past_due' };

  // ── Guards phone ───────────────────────────────────────────────────────
  const phone = (merchant.phone || '').trim();
  if (!phone || phone.length < 8) return { success: false, skipped: 'invalid_phone' };
  if (await isPhoneBlacklisted(supabase, phone)) return { success: false, skipped: 'blacklisted' };

  // ── Guards dedup (atomic claim) ────────────────────────────────────────
  // Step 2 ne part jamais sans step 1 prealable (cohérence narrative).
  if (step === 2 && !merchant.past_due_sms1_sent_at) return { success: false, skipped: 'no_sms1_yet' };

  const flagColumn = step === 1 ? 'past_due_sms1_sent_at' : 'past_due_sms2_sent_at';

  // Atomic UPDATE : claim ou rien. Le 2eme worker concurrent voit 0 row updated et skip.
  const { data: claimed, error: claimError } = await supabase
    .from('merchants')
    .update({ [flagColumn]: new Date().toISOString() })
    .eq('id', merchant.id)
    .is(flagColumn, null)
    .eq('subscription_status', 'past_due') // Re-check status au moment du claim
    .select('id')
    .maybeSingle();

  if (claimError) {
    logger.error('[past-due-sms] claim error', { merchantId: merchant.id, step, error: claimError });
    return { success: false, skipped: 'send_failed', error: String(claimError.message || claimError) };
  }
  if (!claimed) return { success: false, skipped: 'already_sent' };

  // ── Envoi ──────────────────────────────────────────────────────────────
  const body = buildBody(step);
  const provider = selectProvider(phone);
  const smsType = step === 1 ? 'past_due_initial' : 'past_due_reminder';

  let success = false;
  let msgId: string | undefined;
  let errorMessage: string | null = null;

  try {
    const result = provider === 'sms_partner'
      ? await sendSmsPartner(phone, body)
      : await sendSms(phone, body, 'transactional');
    success = result.success;
    msgId = result.jobId;
    errorMessage = result.error || null;
  } catch (err) {
    success = false;
    errorMessage = String(err);
  }

  // ── Log ────────────────────────────────────────────────────────────────
  // On log dans tous les cas (sent ou failed) pour audit/debug.
  await supabase.from('merchant_marketing_sms_logs').insert({
    merchant_id: merchant.id,
    sms_type: smsType,
    body,
    ovh_job_id: msgId ?? null,
    status: success ? 'sent' : 'failed',
    error_message: errorMessage,
    cost_euro: success ? SMS_UNIT_COST : null,
  }).then(({ error }) => {
    if (error) logger.error('[past-due-sms] log insert failed', { merchantId: merchant.id, step, error });
  });

  // ── Rollback flag si echec envoi ───────────────────────────────────────
  // On a pose le flag de maniere optimiste pour eviter le race ; en cas d'echec
  // on l'enleve pour qu'une prochaine tentative (cron suivant) puisse retenter.
  if (!success) {
    await supabase
      .from('merchants')
      .update({ [flagColumn]: null })
      .eq('id', merchant.id);
    return { success: false, skipped: 'send_failed', error: errorMessage || undefined };
  }

  logger.info('[past-due-sms] sent', { merchantId: merchant.id, step, provider, msgId });
  return { success: true };
}

/**
 * Reset des 2 flags dunning. Appele par Stripe webhook invoice.payment_succeeded
 * quand le merchant remonte de past_due → active. Permet au cycle suivant de
 * repartir avec SMS 1 + SMS 2 dispo.
 */
export async function resetPastDueSmsFlags(
  supabase: SupabaseClient,
  merchantId: string,
): Promise<void> {
  const { error } = await supabase
    .from('merchants')
    .update({
      past_due_sms1_sent_at: null,
      past_due_sms2_sent_at: null,
    })
    .eq('id', merchantId);
  if (error) {
    logger.error('[past-due-sms] reset flags failed', { merchantId, error });
  }
}
