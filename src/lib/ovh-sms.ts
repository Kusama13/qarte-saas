import { createHash } from 'crypto';

const APP_KEY = process.env.OVH_APP_KEY || '';
const APP_SECRET = process.env.OVH_APP_SECRET || '';
const CONSUMER_KEY = process.env.OVH_CONSUMER_KEY || '';
const SMS_SERVICE = process.env.OVH_SMS_SERVICE || '';
const SMS_SENDER = process.env.OVH_SMS_SENDER || 'Qarte';

const OVH_BASE = 'https://eu.api.ovh.com/1.0';

// Cache time delta between local clock and OVH server (max 5 min)
let timeDelta: number | null = null;
let timeDeltaFetchedAt = 0;
const TIME_DELTA_TTL = 5 * 60 * 1000;

async function getTimeDelta(): Promise<number> {
  if (timeDelta !== null && Date.now() - timeDeltaFetchedAt < TIME_DELTA_TTL) {
    return timeDelta;
  }
  const res = await fetch(`${OVH_BASE}/auth/time`);
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

async function ovhRequest(method: string, path: string, body?: Record<string, unknown>): Promise<{ ok: boolean; data: unknown; status: number }> {
  const url = `${OVH_BASE}${path}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  const delta = await getTimeDelta();
  const timestamp = Math.floor(Date.now() / 1000) + delta;
  const signature = sign(method, url, bodyStr, timestamp);

  const res = await fetch(url, {
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
      const errMsg = typeof data === 'object' && data && 'message' in data ? String((data as { message: string }).message) : `HTTP ${status}`;
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
