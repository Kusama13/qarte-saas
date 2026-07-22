import { sanitizeSmsForGsm7 } from './sms-sanitize';
import { fetchWithRetry } from './fetch-with-retry';
import logger from './logger';

const API_KEY = (process.env.SMS_PARTNER_API_KEY || '').trim();
// Trim d'abord, fallback après — sinon une env var Vercel à "\n" passe le `||` et donne ""
// après trim (cf. cas équivalent corrigé dans ovh-sms.ts).
const SMS_SENDER =
  ((process.env.SMS_PARTNER_SENDER || '').trim()) ||
  ((process.env.OVH_SMS_SENDER || '').trim()) ||
  'Qarte';
const SANDBOX = (process.env.SMS_PARTNER_SANDBOX || '').trim().toLowerCase() === 'true';
// URL absolue de notre endpoint webhook DLR. SMS Partner POSTe ici quand le statut
// du SMS change (delivered/not delivered/waiting). Cf /api/sms-partner/dlr.
// Inclut un secret en query string (pas de signature HMAC documentee cote SMS Partner).
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
const DLR_SECRET = (process.env.SMS_PARTNER_DLR_SECRET || '').trim();
const DLR_URL = APP_URL && DLR_SECRET ? `${APP_URL}/api/sms-partner/dlr?secret=${DLR_SECRET}` : '';
// Warn (pas throw) au boot si la config DLR est incomplete cote SMS Partner.
// Sans DLR : le cron sms-verify reste fallback ultime mais on perd la confirmation
// rapide de livraison + on cumule du delai.
if (API_KEY && !DLR_URL) {
  logger.warn('[sms-partner] urlDlr disabled — set NEXT_PUBLIC_APP_URL + SMS_PARTNER_DLR_SECRET to enable delivery webhook (faster verify, fewer doublons)');
}

const SMS_PARTNER_ENDPOINT = 'https://api.smspartner.fr/v1/send';
const SMS_PARTNER_ME_ENDPOINT = 'https://api.smspartner.fr/v1/me';

// SMS Partner peut etre lent : timeout 10s × 3 tentatives via fetch-with-retry helper.
// Incident 2026-04-30 + 2026-05-02 : 5s causait "aborted" massif (faux negatifs).
const SMS_PARTNER_TIMEOUT_MS = 10000;

interface SmsPartnerSuccess {
  success: true;
  code: number;
  message_id: number;
  nb_sms?: number;
  cost?: number;
  currency?: string;
}

interface SmsPartnerError {
  success: false;
  code: number;
  // errors[] contient le detail par numero. `code` est string ("9", "10") ici, vs number top-level.
  errors?: Array<{ elementId?: string; phoneNumber?: string; code?: string; message?: string }>;
  message?: string;
}

type SmsPartnerResponse = SmsPartnerSuccess | SmsPartnerError;

/**
 * Send an SMS via SMS Partner. Fire-and-forget — never throws.
 * Used for transactional SMS to FR/BE recipients.
 * @param phone E.164 without + (e.g. "33612345678") — `+` est ajouté avant l'envoi.
 * @param message SMS body (max 160 chars 7-bit).
 */
export async function sendSmsPartner(phone: string, message: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
  if (!API_KEY) {
    logger.error('[sms-partner] Missing SMS_PARTNER_API_KEY');
    return { success: false, error: 'Missing SMS Partner config' };
  }

  try {
    const payload: Record<string, unknown> = {
      apiKey: API_KEY,
      phoneNumbers: `+${phone}`,
      message: sanitizeSmsForGsm7(message),
      sender: SMS_SENDER,
    };
    if (SANDBOX) payload.sandbox = 1;
    // urlDlr = callback POST quand SMS Partner finalise la livraison (delivered/not delivered).
    // Permet d'eviter les doublons (on attend le DLR avant de fallback sur OVH en cas de timeout).
    if (DLR_URL) payload.urlDlr = DLR_URL;

    const res = await fetchWithRetry(SMS_PARTNER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, { timeoutMs: SMS_PARTNER_TIMEOUT_MS });

    const data = await res.json().catch(() => null) as SmsPartnerResponse | null;

    if (!res.ok || !data || data.success !== true) {
      // SMS Partner peut renvoyer un `code` top-level generique (ex: 55 "Aucun numero a envoyer")
      // PLUS un `errors[].code` per-numero plus precis (ex: 9 "telephone invalide").
      // On utilise le code per-numero en priorite car c'est lui qui porte la vraie cause.
      const topLevelCode = data && 'code' in data ? data.code : 'unknown';
      const perNumberCode = (data && 'errors' in data && data.errors?.length && data.errors[0].code) ? data.errors[0].code : null;
      const errCode = perNumberCode ?? topLevelCode;
      const errDetail = (data && 'errors' in data && data.errors?.length)
        ? data.errors.map(e => e.message).filter(Boolean).join('; ')
        : (data && 'message' in data ? data.message : null);
      const errMsg = `[HTTP ${res.status}] SMS Partner error (code ${errCode})${errDetail ? `: ${errDetail}` : ''}`;
      logger.error(`[sms-partner] Send failed: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    // Garde-fou (incident 2026-07-22) : la passerelle SMS Partner peut se degrader
    // et repondre un accuse generique `{success:true, code:200, message:"Request
    // queued for processing"}` SANS `message_id` — elle repond alors pareil sans
    // cle API et sur un endpoint inexistant. Sans identifiant, l'envoi n'est ni
    // tracable (pas de DLR) ni livre en pratique. On le traite comme un echec :
    // sinon on marque "sent" un SMS fantome et le fallback OVH ne part jamais.
    // Le message ne matche aucun pattern du classifier -> classe 'unknown' -> fallback OVH.
    const messageId = data.message_id;
    if (messageId === undefined || messageId === null || String(messageId).trim() === '') {
      const errMsg = `[HTTP ${res.status}] SMS Partner: accuse sans message_id (passerelle degradee)`;
      logger.error(`[sms-partner] Send failed: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    return { success: true, jobId: String(messageId) };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[sms-partner] Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

/**
 * Solde de crédits SMS Partner restants (en unités SMS standard).
 * GET /v1/me?apiKey=... — la réponse renvoie un objet `credits` :
 *   { creditSms: number, creditSmsECO: number, creditHlr: number, balance: "10.5", currency: "EUR", ... }
 * On retourne `creditSms` (SMS standards utilisés pour le transactionnel FR/BE).
 * Returns null si la requête échoue ou si l'API key est absente.
 */
export async function getSmsPartnerCredit(): Promise<number | null> {
  if (!API_KEY) return null;
  try {
    const url = `${SMS_PARTNER_ME_ENDPOINT}?apiKey=${encodeURIComponent(API_KEY)}`;
    const res = await fetchWithRetry(url, { method: 'GET' }, { timeoutMs: SMS_PARTNER_TIMEOUT_MS });
    const data = await res.json().catch(() => null) as { credits?: { creditSms?: number } } | null;
    if (!res.ok || !data?.credits) return null;
    const credits = Number(data.credits.creditSms);
    return Number.isFinite(credits) ? credits : null;
  } catch (err) {
    logger.error(`[sms-partner] getSmsPartnerCredit error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
