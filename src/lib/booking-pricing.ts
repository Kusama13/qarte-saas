/**
 * Source unique de vérité pour le calcul du prix d'un booking avec réductions.
 * Réutilisé par BookingModal (vitrine), BookingDetailsModal (manual), et les
 * routes API qui valident/stockent le prix côté serveur (book, manual-booking).
 *
 * Règle : pas de cumul. On applique UNE seule offre, celle qui économise le
 * plus d'euros à la cliente (member vs welcome vs promo). Comparaison en EUR
 * et non en % parce qu'une promo ciblée à 30% sur 1 prestation peut être
 * plus rentable qu'un welcome global à 15% selon le panier.
 *
 * Mig 157 : la promo peut être ciblée sur un sous-ensemble de prestations
 * (`promoTargetServiceIds`). Dans ce cas le calcul se fait per-line.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

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

export type ServiceLine = { id: string; price: number };

/** ID sentinel pour la ligne d'une prestation perso (custom_service_*).
 *  Pas un vrai UUID → ne match jamais target_service_ids → la promo
 *  ciblée ne s'applique pas aux prestations perso, par design. */
export const CUSTOM_SERVICE_LINE_ID = '__custom__';

/** Récupère les prix réels des prestations sélectionnées + ajoute la
 *  prestation perso si fournie. Utilisé par les routes manual-booking
 *  et planning PATCH pour valider/calculer les réductions server-side. */
export async function buildServiceLines(
  supabase: SupabaseClient,
  merchantId: string,
  serviceIds: string[] | undefined | null,
  customServicePrice: number | undefined | null,
): Promise<ServiceLine[]> {
  const lines: ServiceLine[] = [];
  if (serviceIds && serviceIds.length > 0) {
    const { data } = await supabase
      .from('merchant_services')
      .select('id, price')
      .eq('merchant_id', merchantId)
      .in('id', serviceIds);
    for (const s of (data || []) as Array<{ id: string; price: number | string }>) {
      lines.push({ id: s.id, price: Number(s.price || 0) });
    }
  }
  if (customServicePrice && customServicePrice > 0) {
    lines.push({ id: CUSTOM_SERVICE_LINE_ID, price: Number(customServicePrice) });
  }
  return lines;
}

export type AppliedDiscounts = {
  member?: number;
  welcome?: number;
  promo?: number;
  /** Montant € réellement économisé par la promo (utile quand ciblée par service). */
  promoAmount?: number;
};

export type BookingPriceResult = {
  rawPrice: number;
  finalPrice: number;
  appliedDiscounts: AppliedDiscounts;
  hasDiscount: boolean;
};

export type BookingPriceOpts = {
  serviceLines: ServiceLine[];
  memberPercent?: number | null;
  welcomePercent?: number | null;
  promoPercent?: number | null;
  /** Si non vide : la promo ne s'applique qu'aux services listés. NULL/vide
   *  = applicable à toute la résa (comportement legacy). */
  promoTargetServiceIds?: string[] | null;
};

export function computeBookingPrice(opts: BookingPriceOpts): BookingPriceResult {
  const total = opts.serviceLines.reduce((s, l) => s + Number(l.price || 0), 0);

  const memberPct = opts.memberPercent && opts.memberPercent > 0 ? opts.memberPercent : 0;
  const welcomePct = opts.welcomePercent && opts.welcomePercent > 0 ? opts.welcomePercent : 0;
  const promoPct = opts.promoPercent && opts.promoPercent > 0 ? opts.promoPercent : 0;
  const targets = opts.promoTargetServiceIds && opts.promoTargetServiceIds.length > 0
    ? new Set(opts.promoTargetServiceIds)
    : null;

  // Calcul de l'economie potentielle de chaque offre, en EUR.
  const memberAmount = total * memberPct / 100;
  const welcomeAmount = total * welcomePct / 100;
  let promoAmount = 0;
  if (promoPct > 0) {
    const eligibleLines = targets
      ? opts.serviceLines.filter((l) => targets.has(l.id))
      : opts.serviceLines;
    promoAmount = eligibleLines.reduce((s, l) => s + Number(l.price || 0) * promoPct / 100, 0);
  }

  // Pas de cumul : on garde la meilleure offre uniquement.
  type Winner = 'member' | 'welcome' | 'promo' | null;
  let winner: Winner = null;
  let bestAmount = 0;
  if (memberAmount > bestAmount)  { winner = 'member';  bestAmount = memberAmount; }
  if (welcomeAmount > bestAmount) { winner = 'welcome'; bestAmount = welcomeAmount; }
  if (promoAmount > bestAmount)   { winner = 'promo';   bestAmount = promoAmount; }

  const finalPrice = Math.round(total - bestAmount);

  return {
    rawPrice: total,
    finalPrice,
    appliedDiscounts: {
      member:  winner === 'member'  ? memberPct  : undefined,
      welcome: winner === 'welcome' ? welcomePct : undefined,
      promo:   winner === 'promo'   ? promoPct   : undefined,
      promoAmount: winner === 'promo' ? Math.round(promoAmount) : undefined,
    },
    hasDiscount: finalPrice < total,
  };
}
