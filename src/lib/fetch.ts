/**
 * Client-side fetch helper with .ok check, JSON parse, timeout + abort signal.
 * Returns null on any failure (network error, non-ok status, timeout, abort).
 * Use with `?? fallback` for a safe default.
 */

interface SafeFetchOptions extends RequestInit {
  /** Request timeout in ms. Default: 10_000. Pass Infinity to disable. */
  timeoutMs?: number;
}

function mergeSignals(signals: AbortSignal[]): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal) {
    return (AbortSignal as unknown as { any: (s: AbortSignal[]) => AbortSignal }).any(signals);
  }
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export async function safeFetchJson<T = unknown>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T | null> {
  const { timeoutMs = 10_000, signal, ...init } = options;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutController = new AbortController();
  if (Number.isFinite(timeoutMs)) {
    timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  }

  const combined = signal ? mergeSignals([signal, timeoutController.signal]) : timeoutController.signal;

  try {
    const res = await fetch(url, { ...init, signal: combined });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
