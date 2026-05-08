/**
 * Source unique de vérité pour le calcul du prix d'un booking avec réductions.
 * Réutilisé par BookingModal (vitrine), BookingDetailsModal (manual), et les
 * routes API qui valident/stockent le prix côté serveur (book, manual-booking).
 *
 * Règles :
 *   - Member fidèle : TOUJOURS cumulé (statut permanent VIP, le merchant a
 *     pris la décision de récompenser ses meilleures clientes).
 *   - Welcome vs Promo : pas de cumul entre elles, on garde la plus rentable
 *     en EUR (comparaison en EUR car promo ciblée 30% sur 1 prestation peut
 *     battre welcome global 15% selon le panier).
 *   - Final = total - memberAmount - max(welcomeAmount, promoAmount)
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
  /** Montant € réellement économisé par le member (precision centime). */
  memberAmount?: number;
  welcome?: number;
  /** Montant € réellement économisé par le welcome (precision centime). */
  welcomeAmount?: number;
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

  // Member fidele : toujours cumule.
  const memberAmount = total * memberPct / 100;

  // Welcome vs Promo : on garde la plus rentable en EUR.
  const welcomeAmount = total * welcomePct / 100;
  let promoAmount = 0;
  if (promoPct > 0) {
    const eligibleLines = targets
      ? opts.serviceLines.filter((l) => targets.has(l.id))
      : opts.serviceLines;
    promoAmount = eligibleLines.reduce((s, l) => s + Number(l.price || 0) * promoPct / 100, 0);
  }
  type SecondWinner = 'welcome' | 'promo' | null;
  let secondWinner: SecondWinner = null;
  let secondAmount = 0;
  if (welcomeAmount > secondAmount) { secondWinner = 'welcome'; secondAmount = welcomeAmount; }
  if (promoAmount > secondAmount)   { secondWinner = 'promo';   secondAmount = promoAmount; }

  const finalPrice = Math.round(total - memberAmount - secondAmount);

  // Precision centime sur tous les amounts : Math.round entier cassait l'affichage
  // (ex: promoAmount 0,50€ devenait 1€ via Math.round(0.50)=1).
  const round = (x: number) => Math.round(x * 100) / 100;

  return {
    rawPrice: total,
    finalPrice,
    appliedDiscounts: {
      member:        memberAmount > 0 ? memberPct : undefined,
      memberAmount:  memberAmount > 0 ? round(memberAmount) : undefined,
      welcome:       secondWinner === 'welcome' ? welcomePct : undefined,
      welcomeAmount: secondWinner === 'welcome' ? round(welcomeAmount) : undefined,
      promo:         secondWinner === 'promo'   ? promoPct   : undefined,
      promoAmount:   secondWinner === 'promo'   ? round(promoAmount) : undefined,
    },
    hasDiscount: finalPrice < total,
  };
}
