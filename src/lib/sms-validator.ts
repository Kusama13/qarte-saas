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
}

export interface SmsValidationOptions {
  maxChars?: number;
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

// Variables template autorisees — resolues au dispatch (par destinataire pour
// {prenom}, ou par campagne pour {shop_name}). Toute autre {xxx} reste une
// erreur (typo merchant, ex: {client} au lieu de {prenom}).
export const KNOWN_TEMPLATE_VARS = new Set(['{prenom}', '{shop_name}', '{lien_resa}']);

function containsUnknownVariables(body: string): string[] {
  const matches = body.match(/\{[^}]+\}/g);
  if (!matches) return [];
  const unique = Array.from(new Set(matches));
  return unique.filter(v => !KNOWN_TEMPLATE_VARS.has(v));
}

export function validateMarketingSms(
  body: string,
  options: SmsValidationOptions = {}
): SmsValidationResult {
  const { maxChars = SMS_LIMIT_MAX } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  const final = body.trim();
  const charCount = final.length;
  const smsCount = countSms(final);

  if (!final) errors.push('Le message est vide.');

  if (charCount > maxChars) {
    errors.push(`Message trop long (${charCount} caractères, max ${maxChars}).`);
  }

  const forbidden = containsForbiddenWord(final);
  if (forbidden) errors.push(`Terme non autorisé : « ${forbidden} ».`);

  const unknown = containsUnknownVariables(final);
  if (unknown.length > 0) {
    errors.push(`Variable inconnue : ${unknown.join(', ')}. Utilise {prenom} ou {shop_name}.`);
  }

  if (smsCount === 2) warnings.push('Ce message fait 2 SMS — coût doublé.');

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    finalBody: final,
    charCount,
    smsCount,
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

export function bodyHasPersonalization(body: string): boolean {
  return body.includes('{prenom}');
}

export interface CampaignSmsBreakdown {
  totalSms: number;
  /** Distribution {1: nb_destinataires, 2: nb_destinataires, 3: nb} */
  distribution: { 1: number; 2: number; 3: number };
  /** SMS count moyen par destinataire (totalSms / count) */
  perRecipientAvg: number;
  /** Count baseline si on faisait sans personnaliser (avec prenom='') */
  baselineSmsPerRecipient: number;
  baselineTotalSms: number;
  /** Nombre de destinataires qui consomment plus de SMS que le baseline a cause de leur prenom */
  recipientsExtraCost: number;
  /** Sample du prenom le plus long (pour exemple UI) */
  longestFirstName: string | null;
  /** Le prenom le plus long fait combien de SMS ? */
  longestFirstNameSmsCount: number;
}

/**
 * Calcule la repartition reelle des SMS par destinataire pour une campagne.
 * Source de verite unique : composer/submit/dispatch utilisent ce helper pour
 * avoir le meme comptage. Si le body ne contient pas {prenom}, on retourne
 * juste le count baseline (zero overhead, count uniforme).
 *
 * @param body — body brut (sera normalise GSM-7 + STOP OVH ajoute)
 * @param recipients — liste { phone, firstName } pour chaque destinataire
 * @param shopName — nom du commerce pour {shop_name}
 */
export function computeCampaignSmsBreakdown(
  body: string,
  recipients: { phone: string; firstName: string | null }[],
  shopName: string
): CampaignSmsBreakdown {
  const normalized = normalizeToGsm7(body);
  const baselineBody = withOvhStopClause(resolveVariables(normalized, { prenom: '', shop_name: shopName }));
  const baselineSmsPerRecipient = countSms(baselineBody);
  const distribution = { 1: 0, 2: 0, 3: 0 };
  let totalSms = 0;
  let recipientsExtraCost = 0;
  let longestFirstName: string | null = null;
  let longestLength = 0;

  if (!bodyHasPersonalization(body)) {
    distribution[baselineSmsPerRecipient as 1 | 2 | 3] = recipients.length;
    return {
      totalSms: recipients.length * baselineSmsPerRecipient,
      distribution,
      perRecipientAvg: baselineSmsPerRecipient,
      baselineSmsPerRecipient,
      baselineTotalSms: recipients.length * baselineSmsPerRecipient,
      recipientsExtraCost: 0,
      longestFirstName: null,
      longestFirstNameSmsCount: baselineSmsPerRecipient,
    };
  }

  let longestSms = baselineSmsPerRecipient;
  for (const r of recipients) {
    const prenom = (r.firstName || '').trim().slice(0, 50);
    const personalized = withOvhStopClause(resolveVariables(normalized, { prenom, shop_name: shopName }));
    const sms = countSms(personalized);
    distribution[sms as 1 | 2 | 3]++;
    totalSms += sms;
    if (sms > baselineSmsPerRecipient) recipientsExtraCost++;
    if (prenom.length > longestLength) {
      longestLength = prenom.length;
      longestFirstName = prenom;
      longestSms = sms;
    }
  }

  return {
    totalSms,
    distribution,
    perRecipientAvg: recipients.length > 0 ? totalSms / recipients.length : 0,
    baselineSmsPerRecipient,
    baselineTotalSms: recipients.length * baselineSmsPerRecipient,
    recipientsExtraCost,
    longestFirstName,
    longestFirstNameSmsCount: longestSms,
  };
}
