/**
 * Pricing & bonus partagés pour les packs SMS — single source of truth.
 * Importé par : checkout/route.ts (Stripe), webhook/route.ts (crédit), BuyPackModal.tsx (UI).
 *
 * Prix TTC envoyés directement à Stripe (TVA 20% incluse, pas de Stripe Tax).
 * Bonus SMS = +10% à partir du pack 150 (gratuit pour le merchant, marketing).
 */

export type PackSize = 50 | 100 | 150 | 200 | 250;

export const PACK_SIZES: readonly PackSize[] = [50, 100, 150, 200, 250] as const;

export const PACK_TTC_CENTS: Record<PackSize, number> = {
  50: 690,
  100: 1020,
  150: 1470,
  200: 1920,
  250: 2370,
};

export const BONUS_SMS_BY_SIZE: Record<PackSize, number> = {
  50: 0,
  100: 0,
  150: 15,
  200: 20,
  250: 25,
};

export const PROCESSING_FEE_TTC_CENTS = 100; // 1€ TTC
export const VAT_RATE = 0.20;

export function getBonusSms(size: PackSize): number {
  return BONUS_SMS_BY_SIZE[size] || 0;
}

/** Total SMS effectivement crédités au merchant (pack_size + bonus). */
export function getCreditedSmsCount(size: PackSize): number {
  return size + getBonusSms(size);
}
