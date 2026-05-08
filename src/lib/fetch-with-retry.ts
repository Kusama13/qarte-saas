/**
 * Fetch avec timeout + retry exponentiel. Helper partage entre les
 * providers SMS (OVH, SMS Partner) et toute autre integration HTTP qui
 * doit absorber les blips reseau transitoires.
 *
 * Comportement :
 * - timeout par tentative via AbortController
 * - retry UNIQUEMENT sur erreur fetch bas niveau (DNS, abort, network)
 * - JAMAIS retry sur HTTP 4xx/5xx (le caller decide)
 * - backoff entre les tentatives (default 400ms, 1500ms entre 2-3)
 *
 * Note : un retry sur timeout cote provider est une semantique "at-least-once".
 * Pour les sends SMS, le caller doit gerer le risque de doublon (cf. DLR
 * SMS Partner pour confirmation cote sms.ts:sendWithIntelligentFallback).
 */

export interface FetchWithRetryOptions {
  /** ms avant abort de la tentative en cours. Default 8000. */
  timeoutMs?: number;
  /** Nombre total de tentatives (incluant la 1ere). Default 3. */
  maxAttempts?: number;
  /** Backoff entre attempts. backoffMs[i] = attente entre attempt i et i+1. */
  backoffMs?: number[];
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = [400, 1500];

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: FetchWithRetryOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const backoffMs = opts.backoffMs ?? DEFAULT_BACKOFF_MS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: ac.signal });
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, backoffMs[attempt] ?? 1500));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('fetchWithRetry: unreachable');
}
