/**
 * Classification des erreurs SMS pour decider intelligemment du fallback.
 *
 * Regles principales :
 * - 'invalid_phone' : aucun fallback, blacklist apres 2 confirmations
 * - 'config_error'  : aucun fallback, alerte admin immediate (cle API cassee)
 * - 'no_credit'     : fallback autre provider + alerte admin (recharger)
 * - 'timeout'       : ambigu, status='pending_verify', attendre DLR avant fallback
 * - 'rate_limit'    : backoff plus long puis retry meme provider
 * - 'server_error'  : fallback autre provider (5xx provider)
 * - 'unknown'       : log + fallback autre provider par precaution
 */

export type SmsErrorClass =
  | 'success'
  | 'invalid_phone'
  | 'no_credit'
  | 'rate_limit'
  | 'timeout'
  | 'server_error'
  | 'config_error'
  | 'unknown';

interface ProviderResult {
  success: boolean;
  jobId?: string;
  error?: string;
  creditExhausted?: boolean;
}

/**
 * Classifie une erreur OVH. Codes communs detectes via le format
 * "[HTTP {status}] {message} ({errorCode})" produit par ovh-sms.ts.
 */
export function classifyOvhError(result: ProviderResult): SmsErrorClass {
  if (result.success) return 'success';
  if (result.creditExhausted) return 'no_credit';

  const err = (result.error || '').toLowerCase();

  // AbortError de fetch (timeout)
  if (err.includes('aborted') || err.includes('timeout')) return 'timeout';

  // Codes erreur OVH explicites (extraits du format "(CODE)" en fin de message)
  if (err.includes('invalid_receiver') || err.includes('invalid receiver')) return 'invalid_phone';
  if (err.includes('not_enough_credits') || err.includes('not enough credits')) return 'no_credit';
  if (err.includes('invalid_application') || err.includes('invalid_signature') || err.includes('invalid_credential')) {
    return 'config_error';
  }
  if (err.includes('too_many_receivers')) return 'invalid_phone'; // batch trop gros = config bug

  // HTTP status
  if (err.includes('[http 401]') || err.includes('[http 403]')) return 'config_error';
  if (err.includes('[http 402]')) return 'no_credit';
  if (err.includes('[http 429]')) return 'rate_limit';
  if (err.includes('[http 5')) return 'server_error';
  if (err.includes('[http 4')) return 'invalid_phone'; // 4xx generique = client error, probable phone/format

  return 'unknown';
}

/**
 * Classifie une erreur SMS Partner. Codes 1/2/9/10/11 documentes dans
 * https://www.docpartner.dev (cf audit sms 2026-05-08).
 */
export function classifySmsPartnerError(result: ProviderResult): SmsErrorClass {
  if (result.success) return 'success';

  const err = (result.error || '').toLowerCase();

  // AbortError de fetch (timeout 10s × 3 retries)
  if (err.includes('aborted') || err.includes('timeout')) return 'timeout';

  // Codes erreur SMS Partner explicites (extraits du format "code N" dans error_message)
  // Format genere par sms-partner.ts: "[HTTP X] SMS Partner error (code N): ..."
  if (err.includes('code 1)') || err.includes('code 10)')) return 'config_error'; // API key
  if (err.includes('code 2)')) return 'invalid_phone'; // phone required (mal forme)
  if (err.includes('code 9)')) return 'invalid_phone'; // contrainte (format/date)
  if (err.includes('code 11)')) return 'no_credit';

  // HTTP status (sms-partner.ts inclut `[HTTP {status}]` dans l'error)
  if (err.includes('[http 401]') || err.includes('[http 403]')) return 'config_error';
  if (err.includes('[http 402]')) return 'no_credit';
  if (err.includes('[http 429]')) return 'rate_limit';
  if (err.includes('[http 5')) return 'server_error';
  if (err.includes('[http 400]') || err.includes('[http 422]')) return 'invalid_phone';

  return 'unknown';
}

/**
 * True si l'erreur justifie un fallback vers l'autre provider.
 * - timeout n'autorise PAS le fallback immediat (ambigu, attendre DLR)
 * - invalid_phone et config_error ne fallback jamais (sans interet ou critique)
 */
export function shouldFallback(errorClass: SmsErrorClass): boolean {
  return errorClass === 'no_credit'
      || errorClass === 'rate_limit'
      || errorClass === 'server_error'
      || errorClass === 'unknown';
}

/**
 * True si l'erreur est definitive sur ce numero (toute future tentative inutile).
 * Apres 2 occurrences sur 2 providers differents → blacklister.
 */
export function isPermanentPhoneError(errorClass: SmsErrorClass): boolean {
  return errorClass === 'invalid_phone';
}

/**
 * True si l'erreur est ambigue (peut avoir ete envoyee). Necessite verify via DLR.
 * Aujourd'hui : timeout SMS Partner. OVH n'a pas de DLR fiable, on fallback direct.
 */
export function isAmbiguous(errorClass: SmsErrorClass): boolean {
  return errorClass === 'timeout';
}
