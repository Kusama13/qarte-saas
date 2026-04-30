/**
 * Gift cards (bons cadeaux) — helpers partagés.
 *
 * Source unique pour : génération de code public, expiration, payload SMS/email,
 * etc. Tout ce qui est consommé par plus d'une route doit vivre ici.
 */

import { supabaseAdmin } from './supabase';

export const GIFT_CARD_EXPIRY_MONTHS = 12;
export const GIFT_CARD_AUTO_CANCEL_DAYS = 3;
export const GIFT_CARD_MIN_AMOUNT = 5;
export const GIFT_CARD_MAX_AMOUNT = 1000;
export const GIFT_CARD_DEFAULT_AMOUNTS = [30, 50, 80, 100];

/** Caractères du code public (sans 0/O/I/1/L pour éviter confusions visuelles). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** Génère un code unique du type `GIFT-AB23CD`. Retry jusqu'à 5 fois en cas de collision. */
export async function generateGiftCardCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    const code = `GIFT-${suffix}`;
    const { data: existing } = await supabaseAdmin()
      .from('gift_cards')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique gift card code after 5 attempts');
}

/** Calcule la date d'expiration (12 mois après paid_at). */
export function computeGiftCardExpiry(paidAt: Date = new Date()): Date {
  const exp = new Date(paidAt);
  exp.setMonth(exp.getMonth() + GIFT_CARD_EXPIRY_MONTHS);
  return exp;
}

/** Parse `merchants.gift_card_amounts` (JSONB) → array de nombres validés. */
export function parseGiftCardAmounts(raw: unknown): number[] {
  if (!Array.isArray(raw)) return GIFT_CARD_DEFAULT_AMOUNTS;
  const amounts = raw
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= GIFT_CARD_MIN_AMOUNT && v <= GIFT_CARD_MAX_AMOUNT);
  return amounts.length > 0 ? amounts : GIFT_CARD_DEFAULT_AMOUNTS;
}

/** True si le merchant a configuré au moins un lien de paiement. */
export function merchantHasPaymentLink(merchant: { deposit_link: string | null; deposit_link_2: string | null }): boolean {
  return Boolean(merchant.deposit_link?.trim() || merchant.deposit_link_2?.trim());
}
