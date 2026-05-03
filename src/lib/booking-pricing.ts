/**
 * Source unique de vérité pour le calcul du prix d'un booking avec réductions.
 * Réutilisé par BookingModal (vitrine), BookingDetailsModal (manual), et les
 * routes API qui valident/stockent le prix côté serveur (book, manual-booking).
 *
 * Cumul : member × welcome × promo (multiplicatif), arrondi à l'euro le plus proche.
 */

export const MIN_DISCOUNT_PERCENT = 1;
export const MAX_DISCOUNT_PERCENT = 100;

/**
 * Parse une valeur (string | number | null | undefined) vers un % de réduction
 * valide. Retourne `null` si la valeur est vide (= pas de réduction = champ optionnel).
 * Throw si la valeur est fournie mais hors plage [1, 100] ou non-entière.
 */
export function parseDiscountPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_DISCOUNT_PERCENT || n > MAX_DISCOUNT_PERCENT) {
    throw new Error(`Discount percent must be an integer between ${MIN_DISCOUNT_PERCENT} and ${MAX_DISCOUNT_PERCENT}`);
  }
  return n;
}

export type AppliedDiscounts = {
  member?: number;
  welcome?: number;
  promo?: number;
};

export type BookingPriceResult = {
  rawPrice: number;
  finalPrice: number;
  appliedDiscounts: AppliedDiscounts;
  hasDiscount: boolean;
};

export type BookingPriceOpts = {
  totalPrice: number;
  memberPercent?: number | null;
  welcomePercent?: number | null;
  promoPercent?: number | null;
};

export function computeBookingPrice(opts: BookingPriceOpts): BookingPriceResult {
  let p = opts.totalPrice;
  if (opts.memberPercent && opts.memberPercent > 0)   p *= 1 - opts.memberPercent / 100;
  if (opts.welcomePercent && opts.welcomePercent > 0) p *= 1 - opts.welcomePercent / 100;
  if (opts.promoPercent && opts.promoPercent > 0)     p *= 1 - opts.promoPercent / 100;
  const finalPrice = Math.round(p);
  return {
    rawPrice: opts.totalPrice,
    finalPrice,
    appliedDiscounts: {
      member: opts.memberPercent || undefined,
      welcome: opts.welcomePercent || undefined,
      promo: opts.promoPercent || undefined,
    },
    hasDiscount: finalPrice < opts.totalPrice,
  };
}
