import { sanitizeSmsForGsm7 } from './sms-sanitize';
import logger from './logger';

const API_KEY = (process.env.SMS_PARTNER_API_KEY || '').trim();
// Trim d'abord, fallback après — sinon une env var Vercel à "\n" passe le `||` et donne ""
// après trim (cf. cas équivalent corrigé dans ovh-sms.ts).
const SMS_SENDER =
  ((process.env.SMS_PARTNER_SENDER || '').trim()) ||
  ((process.env.OVH_SMS_SENDER || '').trim()) ||
  'Qarte';
const SANDBOX = (process.env.SMS_PARTNER_SANDBOX || '').trim().toLowerCase() === 'true';

const SMS_PARTNER_ENDPOINT = 'https://api.smspartner.fr/v1/send';
const SMS_PARTNER_ME_ENDPOINT = 'https://api.smspartner.fr/v1/me';

// Timeout + retry exponentiel pour absorber les blips reseau transitoires
// et la latence ponctuelle de SMS Partner. Cas observe : timeout 5s trop court
// → "This operation was aborted" pour confirmation_no_deposit, booking_cancelled etc.
// (cf. sms_logs avec error_message="aborted" 2026-04-30 + 2026-05-02).
// Retry UNIQUEMENT sur erreur fetch bas niveau, pas sur reponses HTTP applicatives.
const FETCH_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [400, 1500]; // entre attempt 0→1 et 1→2

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: ac.signal });
    } catch (err) {
      if (attempt === MAX_ATTEMPTS - 1) throw err;
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt] || 1500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('fetchWithRetry: unreachable');
}

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
  errors?: Array<{ elementId?: string; message?: string }>;
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

    const res = await fetchWithRetry(SMS_PARTNER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null) as SmsPartnerResponse | null;

    if (!res.ok || !data || data.success !== true) {
      const errCode = data && 'code' in data ? data.code : 'unknown';
      const errDetail = (data && 'errors' in data && data.errors?.length)
        ? data.errors.map(e => e.message).filter(Boolean).join('; ')
        : (data && 'message' in data ? data.message : null);
      const errMsg = `[HTTP ${res.status}] SMS Partner error (code ${errCode})${errDetail ? `: ${errDetail}` : ''}`;
      logger.error(`[sms-partner] Send failed: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    return { success: true, jobId: String(data.message_id) };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[sms-partner] Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

/**
 * Solde de crédits SMS Partner restants (en unités SMS).
 * GET /v1/me?apiKey=... — retourne un user object avec un champ "credits"
 * (string ou number selon les versions). On normalise en number.
 * Returns null si la requête échoue ou si l'API key est absente.
 */
export async function getSmsPartnerCredit(): Promise<number | null> {
  if (!API_KEY) return null;
  try {
    const url = `${SMS_PARTNER_ME_ENDPOINT}?apiKey=${encodeURIComponent(API_KEY)}`;
    const res = await fetchWithRetry(url, { method: 'GET' });
    const data = await res.json().catch(() => null) as Record<string, unknown> | null;
    if (!res.ok || !data) return null;
    // SMS Partner renvoie data.credits (number) — fallback sur d'autres noms vus dans la nature
    const raw = data.credits ?? data.creditsLeft ?? data.balance ?? data.smsCredits;
    if (raw == null) return null;
    const credits = Number(raw);
    return Number.isFinite(credits) ? credits : null;
  } catch (err) {
    logger.error(`[sms-partner] getSmsPartnerCredit error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
