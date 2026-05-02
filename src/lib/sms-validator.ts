// SMS marketing content validator: length, forbidden words, STOP mention

import { FORBIDDEN_WORDS } from '@/lib/content-moderation';

// GSM-7 alphabet (3GPP TS 23.038) : 1 SMS = 160, 2 SMS = 306, 3 SMS = 459
// UCS-2 (Unicode, dès qu'un emoji ou char hors GSM-7 est présent) :
// 1 SMS = 70, 2 SMS = 134, 3 SMS = 201
export const SMS_LIMIT_SINGLE = 160;
export const SMS_LIMIT_DOUBLE = 306;
export const SMS_LIMIT_MAX = 306;
export const SMS_LIMIT_SINGLE_UCS2 = 70;
export const SMS_LIMIT_DOUBLE_UCS2 = 134;
export const SMS_LIMIT_TRIPLE_UCS2 = 201;

const GSM7_BASE = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM7_EXT = '|^€{}[~]\\\f';
const GSM7_SET = new Set([...GSM7_BASE, ...GSM7_EXT]);

export function isGsm7(body: string): boolean {
  for (const ch of body) {
    if (!GSM7_SET.has(ch)) return false;
  }
  return true;
}

// Map des chars typographiques fréquents → équivalent GSM-7.
// Couvre : guillemets/apostrophes "smart", tirets long/cadratin, ellipsis, espaces unicode, NBSP.
const GSM7_REPLACEMENTS: Record<string, string> = {
  '’': "'", '‘': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  '–': '-', '—': '-', '−': '-',
  '…': '...',
  ' ': ' ', ' ': ' ', ' ': ' ', '​': '',
  '«': '"', '»': '"',
};

/**
 * Normalise un body SMS pour rester en GSM-7 (1 SMS au lieu de 2 en UCS-2).
 * Remplace les chars typographiques par leurs équivalents ASCII puis supprime
 * tout char non-GSM-7 restant (emojis principalement). Collapse les espaces
 * doubles et trim.
 */
export function normalizeToGsm7(body: string): string {
  let out = '';
  for (const ch of body) {
    const repl = GSM7_REPLACEMENTS[ch];
    if (repl !== undefined) {
      out += repl;
    } else if (GSM7_SET.has(ch)) {
      out += ch;
    }
    // Sinon : drop (emoji, char rare hors GSM-7)
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n[ \t]+/g, '\n').trim();
}

// Marketing-specific forbidden terms that increase spam risk / CNIL flags.
// Combined with the existing shared FORBIDDEN_WORDS list.
const SMS_MARKETING_FORBIDDEN = [
  'cliquez ici', 'click here',
  'urgent',
  'gratuit sans condition',
];

export type SmsCount = 1 | 2;

export interface SmsValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  finalBody: string;
  charCount: number;
  smsCount: SmsCount | 3;
  containsStop: boolean;
}

export interface SmsValidationOptions {
  requireStop?: boolean;
  maxChars?: number;
}

const STOP_RE = /\bstop\b/i;

/**
 * @deprecated Conserve pour compat (composer preview/validation). N'ajoute plus
 * de suffix — OVH ajoute "STOP au 36180" auto via `noStopClause: false` au
 * dispatch. Les anciens templates contenant "STOP SMS" textuel sont aussi
 * nettoyes (sinon doublon).
 */
export function appendStopIfMissing(body: string): string {
  return body.trim();
}

/**
 * Simule la mention STOP qu'OVH ajoute automatiquement aux SMS marketing
 * (via `noStopClause: false`). Format reel observe : ` STOP au 36180`.
 * 14 chars + espace = 15. On ajoute newline + texte = 15 chars padding.
 *
 * A utiliser pour le countSms cote composer/submit/dispatch des SMS marketing
 * SEULEMENT, pour eviter qu'un body de 150 chars affiche "1 SMS" alors que le
 * SMS reellement parti fasse 165 chars et bascule en 2 SMS.
 */
export function withOvhStopClause(body: string): string {
  const trimmed = body.trim();
  return trimmed + '\nSTOP au 36180';
}

export function countSms(body: string): SmsCount | 3 {
  // Codepoint count (Array.from gère les surrogates : 💕 = 1, pas 2 comme .length)
  const len = Array.from(body).length;
  if (isGsm7(body)) {
    if (len <= SMS_LIMIT_SINGLE) return 1;
    if (len <= SMS_LIMIT_DOUBLE) return 2;
    return 3;
  }
  // UCS-2 : tout char hors GSM-7 (emoji, apostrophe typo ', etc.) bascule l'opérateur
  if (len <= SMS_LIMIT_SINGLE_UCS2) return 1;
  if (len <= SMS_LIMIT_DOUBLE_UCS2) return 2;
  return 3;
}

function containsForbiddenWord(body: string): string | null {
  const lower = body.toLowerCase();
  const all = [...FORBIDDEN_WORDS, ...SMS_MARKETING_FORBIDDEN];
  for (const word of all) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return null;
}

function containsUnresolvedVariables(body: string): string[] {
  const matches = body.match(/\{[^}]+\}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

export function validateMarketingSms(
  body: string,
  options: SmsValidationOptions = {}
): SmsValidationResult {
  const { requireStop = true, maxChars = SMS_LIMIT_MAX } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  const final = requireStop ? appendStopIfMissing(body) : body.trim();
  const charCount = final.length;
  const smsCount = countSms(final);
  const containsStop = STOP_RE.test(final);

  if (!body.trim()) errors.push('Le message est vide.');

  if (charCount > maxChars) {
    errors.push(`Message trop long (${charCount} caractères, max ${maxChars}).`);
  }

  const forbidden = containsForbiddenWord(final);
  if (forbidden) errors.push(`Terme non autorisé : « ${forbidden} ».`);

  const unresolved = containsUnresolvedVariables(final);
  if (unresolved.length > 0) {
    errors.push(`Variables non remplacées : ${unresolved.join(', ')}.`);
  }

  if (smsCount === 2) warnings.push('Ce message fait 2 SMS — coût doublé.');

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    finalBody: final,
    charCount,
    smsCount,
    containsStop,
  };
}

// Resolve variables for preview or send. Unknown vars are left as-is.
export interface SmsVariables {
  prenom?: string;
  shop_name?: string;
  lien_resa?: string;
}

export function resolveVariables(template: string, vars: SmsVariables): string {
  return template
    .replace(/\{prenom\}/g, vars.prenom ?? '{prenom}')
    .replace(/\{shop_name\}/g, vars.shop_name ?? '{shop_name}')
    .replace(/\{lien_resa\}/g, vars.lien_resa ?? '{lien_resa}');
}
