import { createHash } from 'crypto';

const APP_KEY = (process.env.OVH_APP_KEY || '').trim();
const APP_SECRET = (process.env.OVH_APP_SECRET || '').trim();
const CONSUMER_KEY = (process.env.OVH_CONSUMER_KEY || '').trim();
const SMS_SERVICE = (process.env.OVH_SMS_SERVICE || '').trim();
// `(env || fallback).trim()` est piégeux : si env vaut "\n" (Vercel + echo ajoutent un newline),
// la string est truthy donc le fallback ne joue PAS — puis le trim donne "" et tous les SMS
// partent avec le numéro court OVH au lieu de "Qarte". On trim D'ABORD, fallback APRÈS.
const SMS_SENDER = ((process.env.OVH_SMS_SENDER || '').trim()) || 'Qarte';

const OVH_BASE = 'https://eu.api.ovh.com/1.0';

// Cache time delta between local clock and OVH server (max 5 min)
let timeDelta: number | null = null;
let timeDeltaFetchedAt = 0;
const TIME_DELTA_TTL = 5 * 60 * 1000;

async function getTimeDelta(): Promise<number> {
  if (timeDelta !== null && Date.now() - timeDeltaFetchedAt < TIME_DELTA_TTL) {
    return timeDelta;
  }
  const res = await fetchWithRetry(`${OVH_BASE}/auth/time`, { method: 'GET' });
  const serverTime = await res.json() as number;
  timeDelta = serverTime - Math.floor(Date.now() / 1000);
  timeDeltaFetchedAt = Date.now();
  return timeDelta;
}

function sign(method: string, url: string, body: string, timestamp: number): string {
  const raw = `${APP_SECRET}+${CONSUMER_KEY}+${method}+${url}+${body}+${timestamp}`;
  const hash = createHash('sha1').update(raw).digest('hex');
  return `$1$${hash}`;
}

// Timeout court + 1 retry pour absorber les blips réseau transitoires
// (cf. error_message="fetch failed" dans sms_logs — undici n'a jamais reçu de réponse).
// On retry UNIQUEMENT sur erreur fetch bas niveau, pas sur HTTP 4xx/5xx.
const FETCH_TIMEOUT_MS = 5000;

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: ac.signal });
    } catch (err) {
      if (attempt === 1) throw err;
      // backoff bref avant le 2e essai
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      clearTimeout(timer);
    }
  }
  // unreachable
  throw new Error('fetchWithRetry: unreachable');
}

async function ovhRequest(method: string, path: string, body?: Record<string, unknown>): Promise<{ ok: boolean; data: unknown; status: number }> {
  const url = `${OVH_BASE}${path}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  const delta = await getTimeDelta();
  const timestamp = Math.floor(Date.now() / 1000) + delta;
  const signature = sign(method, url, bodyStr, timestamp);

  const res = await fetchWithRetry(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Ovh-Application': APP_KEY,
      'X-Ovh-Timestamp': String(timestamp),
      'X-Ovh-Signature': signature,
      'X-Ovh-Consumer': CONSUMER_KEY,
    },
    body: bodyStr || undefined,
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, data, status: res.status };
}

/**
 * Send an SMS via OVH. Fire-and-forget — never throws.
 * @param phone E.164 without + (e.g. "33612345678")
 * @param message SMS body (max 160 chars for single SMS)
 */
export async function sendSms(phone: string, message: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
  if (!APP_KEY || !APP_SECRET || !CONSUMER_KEY || !SMS_SERVICE) {
    console.error('[ovh-sms] Missing OVH SMS environment variables');
    return { success: false, error: 'Missing OVH config' };
  }

  try {
    const jobBody: Record<string, unknown> = {
      message,
      receivers: [`+${phone}`],
      noStopClause: true,
      coding: '7bit',
    };
    // Use named sender if configured, otherwise use OVH short number
    if (SMS_SENDER) {
      jobBody.sender = SMS_SENDER;
    } else {
      jobBody.senderForResponse = true;
    }

    const { ok, data, status } = await ovhRequest('POST', `/sms/${SMS_SERVICE}/jobs`, jobBody);

    if (!ok) {
      const ovhMsg = typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string }).message)
        : null;
      const ovhCode = typeof data === 'object' && data && 'errorCode' in data
        ? String((data as { errorCode: string }).errorCode)
        : null;
      // Format: "[HTTP 400] Invalid phone (INVALID_RECEIVER)" — tout le contexte dans error_message
      const errMsg = [
        `[HTTP ${status}]`,
        ovhMsg || 'OVH error',
        ovhCode ? `(${ovhCode})` : '',
      ].filter(Boolean).join(' ').trim();
      console.error(`[ovh-sms] Send failed: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const jobIds = (data as { ids?: number[] })?.ids;
    const jobId = jobIds?.[0] ? String(jobIds[0]) : undefined;
    return { success: true, jobId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ovh-sms] Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}
