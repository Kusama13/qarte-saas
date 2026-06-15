/**
 * Source unique des tarifs publics affiches sur les pages marketing
 * (PricingSection, page Ambassadeur, comparatifs, etc).
 *
 * Le prix mensuel "semestrial" (`monthlyEquiv`) est l'equivalent par mois quand
 * le client paye en 6 mois — utilise pour l'argument "Y €/mois si tu prends 6 mois".
 *
 * `annual` reste exposé pour les comparatifs historiques (CGV section abonnés
 * legacy) mais n'est plus proposé aux nouveaux merchants depuis mai 2026.
 */

export const PLAN_PRICES = {
  fidelity: { monthly: 14, semestrial: 70, monthlyEquiv: 12, annual: 190 },
  all_in: { monthly: 24, semestrial: 120, monthlyEquiv: 20, annual: 240 },
} as const;

/** Commission ambassadeur appliquee sur le prix mensuel paye par le marchand. */
export const AMBASSADOR_COMMISSION_RATE = 0.20;

/** Commission mensuelle par salon parraine, par tier (en €). */
export const AMBASSADOR_COMMISSION = {
  fidelity: PLAN_PRICES.fidelity.monthly * AMBASSADOR_COMMISSION_RATE,
  all_in: PLAN_PRICES.all_in.monthly * AMBASSADOR_COMMISSION_RATE,
} as const;

/** Format en €.cc avec virgule (ex: 4.8 -> "4,80"). */
export function formatCommission(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
