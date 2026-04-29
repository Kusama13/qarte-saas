const API_KEY = (process.env.SMS_PARTNER_API_KEY || '').trim();
// Trim d'abord, fallback après — sinon une env var Vercel à "\n" passe le `||` et donne ""
// après trim (cf. cas équivalent corrigé dans ovh-sms.ts).
const SMS_SENDER =
  ((process.env.SMS_PARTNER_SENDER || '').trim()) ||
  ((process.env.OVH_SMS_SENDER || '').trim()) ||
  'Qarte';
const SANDBOX = (process.env.SMS_PARTNER_SANDBOX || '').trim().toLowerCase() === 'true';

const SMS_PARTNER_ENDPOINT = 'https://api.smspartner.fr/v1/send';

// Timeout court + 1 retry pour absorber les blips réseau transitoires
// (cf. error_message="fetch failed" dans sms_logs — undici n'a jamais reçu de réponse).
// On retry UNIQUEMENT sur erreur fetch bas niveau, pas sur réponses HTTP applicatives.
const FETCH_TIMEOUT_MS = 5000;

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: ac.signal });
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 400));
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
    console.error('[sms-partner] Missing SMS_PARTNER_API_KEY');
    return { success: false, error: 'Missing SMS Partner config' };
  }

  try {
    const payload: Record<string, unknown> = {
      apiKey: API_KEY,
      phoneNumbers: `+${phone}`,
      message,
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
      console.error(`[sms-partner] Send failed: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    return { success: true, jobId: String(data.message_id) };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[sms-partner] Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}
