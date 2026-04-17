// SMS marketing content validator: length, forbidden words, STOP mention

import { FORBIDDEN_WORDS } from '@/lib/content-moderation';

export const SMS_LIMIT_SINGLE = 160;
export const SMS_LIMIT_DOUBLE = 306;
export const SMS_LIMIT_MAX = 306;

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

export function appendStopIfMissing(body: string): string {
  const trimmed = body.trim();
  if (STOP_RE.test(trimmed)) return trimmed;
  const suffix = ' STOP SMS';
  return (trimmed + suffix).trim();
}

export function countSms(body: string): SmsCount | 3 {
  const len = body.length;
  if (len <= SMS_LIMIT_SINGLE) return 1;
  if (len <= SMS_LIMIT_DOUBLE) return 2;
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
