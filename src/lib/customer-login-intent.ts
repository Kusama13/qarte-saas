/**
 * Login intent passe entre la vitrine /p/[slug] et la page /customer (login).
 * Cookie qarte_cust est HttpOnly + Instagram in-app browser strip les cookies,
 * donc on utilise sessionStorage (survit le temps de l'onglet, multi-pages OK).
 */

export const INTENT_VALUES = ['loyalty', 'booking', 'deposit'] as const;
export type LoginIntent = (typeof INTENT_VALUES)[number] | null;

export type LoginCtx = {
  intent: LoginIntent;
  fromShop: string | null;
  returnTo: string | null;
};

const STORAGE_KEY = 'qarte_login_intent';
const EMPTY_CTX: LoginCtx = { intent: null, fromShop: null, returnTo: null };

// Anti open-redirect : path interne uniquement, refuse les protocol-relative
// URLs `//evil.com/x` qui passent un naïf `startsWith('/')`.
export function isSafeInternalPath(p: unknown): p is string {
  return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//');
}

export function writeLoginIntent(ctx: { intent: LoginIntent; fromShop: string; returnTo: string }): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // Storage indisponible (mode privé strict) — la page /customer affichera
    // juste le wording générique, pas de crash.
  }
}

export function readLoginIntent(): LoginCtx {
  if (typeof window === 'undefined') return EMPTY_CTX;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CTX;
    const parsed = JSON.parse(raw) as Partial<Record<keyof LoginCtx, unknown>>;
    return {
      intent: (INTENT_VALUES as readonly string[]).includes(parsed.intent as string)
        ? (parsed.intent as LoginIntent)
        : null,
      fromShop: typeof parsed.fromShop === 'string' && parsed.fromShop ? parsed.fromShop : null,
      returnTo: isSafeInternalPath(parsed.returnTo) ? parsed.returnTo : null,
    };
  } catch {
    return EMPTY_CTX;
  }
}

export function clearLoginIntent(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
