import type { BillingInterval, Merchant, PlanTier, PlanningIntent, SubscriptionStatus } from '@/types';
export type { BillingInterval };

/**
 * Plan tiers Qarte (avril 2026).
 * - fidelity (19€/95€/190€) : fidélité seule. Pas de planning, résa, ni campagnes SMS manuelles.
 *   SMS auto (anniversaire, parrainage récompense) envoyés sans quota — coût absorbé.
 * - all_in (24€/120€/240€) : full features. 100 SMS marketing/mois (compteur unique pour
 *   anniversaire + parrainage + auto + campagnes manuelles). +10 si abonnement 6 mois,
 *   +20 si abonnement annuel.
 *
 * Pendant le trial, tous les merchants ont accès all_in (sauf SMS sortants déjà gated par PAID_STATUSES).
 * Le tier choisi au checkout détermine ce qui reste accessible une fois abonné.
 */

export interface PlanFeatures {
  /** Quota mensuel pour SMS marketing comptabilisés. 0 pour Fidélité (les SMS auto inclus
   *  ne comptent pas — voir FIDELITY_FREE_SMS_TYPES dans sms.ts ; les campagnes manuelles
   *  sont possibles via achat de pack uniquement). */
  smsQuota: number;
  planning: boolean;
  bookingOnline: boolean;
  /** Accès aux campagnes SMS manuelles. Fidélité y a accès aussi mais avec quota=0
   *  → ils doivent acheter un pack avant d'envoyer (cf submit/route.ts qui check
   *  `quotaLeft + packBalance >= recipients`). */
  marketingSms: boolean;
  memberPrograms: boolean;
  contest: boolean;
  giftCards: boolean;
}

export const PLAN_TIERS: Record<PlanTier, PlanFeatures> = {
  fidelity: {
    smsQuota: 0,
    planning: false,
    bookingOnline: false,
    marketingSms: true,
    memberPrograms: false,
    contest: false,
    giftCards: false,
  },
  all_in: {
    smsQuota: 100,
    planning: true,
    bookingOnline: true,
    marketingSms: true,
    memberPrograms: true,
    contest: true,
    giftCards: true,
  },
};

/**
 * Bonus SMS mensuel selon l'engagement Tout-en-un (post-split pricing).
 * - Annuel = +20 SMS/mois (engagement 12 mois)
 * - 6 mois = +10 SMS/mois (engagement 6 mois, demi-bonus)
 * - Mensuel = 0 (sans engagement)
 *
 * Les annual legacy (créés avant PRICING_SPLIT_DATE) restent à 100 — leur tarif
 * d'époque (180€) prime sur le bonus.
 */
export const ANNUAL_SMS_BONUS = 20;
export const SEMESTRIAL_SMS_BONUS = 10;

export const ALL_IN_MONTHLY_QUOTA = PLAN_TIERS.all_in.smsQuota;
export const ALL_IN_SEMESTRIAL_QUOTA = PLAN_TIERS.all_in.smsQuota + SEMESTRIAL_SMS_BONUS;
export const ALL_IN_ANNUAL_QUOTA = PLAN_TIERS.all_in.smsQuota + ANNUAL_SMS_BONUS;

/**
 * Plafond du catalogue prestations par merchant. Hard limit côté API
 * (`/api/services` POST) + soft limit UI (`ServicesSection` masque le formulaire
 * d'ajout au-delà). Au-delà de ~30, l'UX vitrine se dégrade — on garde la marge
 * pour les pros qui multiplient les déclinaisons (longueurs/types).
 */
export const MAX_SERVICES_PER_MERCHANT = 60;

/**
 * Coerce une valeur DB potentiellement libre (TEXT en base) vers un BillingInterval safe.
 * Utilisé après lecture `merchants.billing_interval` pour éviter les coalesces ternaires partout.
 */
export function normalizeBillingInterval(value: string | null | undefined): BillingInterval {
  if (value === 'annual') return 'annual';
  if (value === 'semestrial') return 'semestrial';
  return 'monthly';
}

/**
 * Quota mensuel SMS pour un tier + intervalle de facturation donnés.
 * Utilisé hors du flux merchant complet (webhook checkout, change-tier prorata, email
 * de confirmation) où on n'a pas besoin de passer un objet merchant entier.
 *
 * Note : pour un check intégrant le flag legacy, passer `isLegacy = true` pour
 * forcer le quota mensuel sur les annual legacy (ils gardent leur tarif historique).
 */
export function getSmsQuotaFor(
  tier: 'fidelity' | 'all_in' | string | null | undefined,
  interval: BillingInterval | string | null | undefined,
  isLegacy = false,
): number {
  if (tier !== 'all_in') return PLAN_TIERS.fidelity.smsQuota;
  if (isLegacy) return ALL_IN_MONTHLY_QUOTA;
  if (interval === 'annual') return ALL_IN_ANNUAL_QUOTA;
  if (interval === 'semestrial') return ALL_IN_SEMESTRIAL_QUOTA;
  return ALL_IN_MONTHLY_QUOTA;
}

type MerchantLike = Pick<Merchant, 'subscription_status' | 'plan_tier' | 'billing_interval' | 'created_at'> | {
  subscription_status?: SubscriptionStatus | string | null;
  plan_tier?: PlanTier | string | null;
  billing_interval?: BillingInterval | null;
  created_at?: string | null;
};

/**
 * Returns the active feature set for a merchant.
 * - Trials → full all_in access (let them experience everything before choosing)
 * - Paid (active/canceling/past_due) → tier-gated
 * - Unknown / missing → safe default all_in (no surprise downgrade)
 */
export function getPlanFeatures(merchant: MerchantLike | null | undefined): PlanFeatures {
  if (!merchant) return PLAN_TIERS.all_in;
  if (merchant.subscription_status === 'trial') return PLAN_TIERS.all_in;
  const tier = (merchant.plan_tier === 'fidelity' ? 'fidelity' : 'all_in') as PlanTier;
  const base = PLAN_TIERS[tier];
  if (tier === 'all_in') {
    const bonus = getEngagementSmsBonus(merchant);
    if (bonus > 0) return { ...base, smsQuota: base.smsQuota + bonus };
  }
  return base;
}

/**
 * Bonus SMS/mois apporté par l'engagement (annuel ou 6 mois) sur Tout-en-un.
 * Returns 0 si pas d'engagement, mensuel, status non payant, ou legacy
 * (les annual legacy gardent 100 SMS — leur tarif historique 180€ prime).
 */
const ENGAGEMENT_BONUS: Record<BillingInterval, number> = {
  monthly: 0,
  semestrial: SEMESTRIAL_SMS_BONUS,
  annual: ANNUAL_SMS_BONUS,
};

export function getEngagementSmsBonus(merchant: MerchantLike | null | undefined): number {
  if (!merchant) return 0;
  const status = merchant.subscription_status;
  if (!status || !(['active', 'canceling', 'past_due'] as const).includes(status as 'active' | 'canceling' | 'past_due')) return 0;
  if (isLegacyMerchant(merchant as { created_at?: string | null })) return 0;
  return ENGAGEMENT_BONUS[normalizeBillingInterval(merchant.billing_interval)];
}

/** True si le merchant bénéficie d'un bonus SMS quelconque (annuel OU 6 mois). */
export function hasAnnualSmsBonus(merchant: MerchantLike | null | undefined): boolean {
  return getEngagementSmsBonus(merchant) > 0;
}

export function getPlanTier(merchant: MerchantLike | null | undefined): PlanTier {
  if (!merchant) return 'all_in';
  if (merchant.subscription_status === 'trial') return 'all_in';
  return merchant.plan_tier === 'fidelity' ? 'fidelity' : 'all_in';
}

/**
 * Date du split pricing 2 tiers (Fidélité / Tout-en-un).
 * Merchants créés avant cette date sont grandfathered : tarif historique conservé,
 * accès full Tout-en-un, bouton changer de plan masqué (sauf super_admin).
 */
export const PRICING_SPLIT_DATE = '2026-04-05';

/**
 * True si le merchant a été créé avant le split pricing — tarif historique
 * conservé, pas de self-service change-tier.
 */
export function isLegacyMerchant(merchant: { created_at?: string | null } | null | undefined): boolean {
  if (!merchant?.created_at) return false;
  return new Date(merchant.created_at) < new Date(PRICING_SPLIT_DATE);
}

/** Convenience checks (UI gating). */
export function hasPlanning(merchant: MerchantLike | null | undefined) {
  return getPlanFeatures(merchant).planning;
}

/**
 * Whether the merchant has explicitly opted out of seeing the Planning module
 * (set via the "Je n'utilise pas le planning" link in the onboarding checklist).
 */
export function isPlanningHidden(merchant: { planning_intent?: PlanningIntent | null } | null | undefined): boolean {
  return merchant?.planning_intent === 'no';
}

/**
 * Single source of truth for "should I render any Planning-related UI / send Planning emails".
 * Combines tier capability AND user intent — both must allow it.
 */
export function showPlanningUi(
  merchant: (MerchantLike & { planning_intent?: PlanningIntent | null }) | null | undefined
): boolean {
  return hasPlanning(merchant) && !isPlanningHidden(merchant);
}
export function hasBookingOnline(merchant: MerchantLike | null | undefined) {
  return getPlanFeatures(merchant).bookingOnline;
}
export function hasMarketingSms(merchant: MerchantLike | null | undefined) {
  return getPlanFeatures(merchant).marketingSms;
}
export function hasMemberPrograms(merchant: MerchantLike | null | undefined) {
  return getPlanFeatures(merchant).memberPrograms;
}
export function hasContest(merchant: MerchantLike | null | undefined) {
  return getPlanFeatures(merchant).contest;
}
export function hasGiftCards(merchant: MerchantLike | null | undefined) {
  return getPlanFeatures(merchant).giftCards;
}

/**
 * Server-side guard for API routes. Throws a 403-shaped error if the merchant
 * tier is below the required level. `feature` is one of PlanFeatures booleans.
 */
export class PlanTierError extends Error {
  status = 403;
  constructor(public feature: keyof PlanFeatures, message?: string) {
    super(message || `Requires Tout-en-un plan (feature: ${String(feature)})`);
    this.name = 'PlanTierError';
  }
}

export function requireFeature(merchant: MerchantLike | null | undefined, feature: keyof PlanFeatures): void {
  const features = getPlanFeatures(merchant);
  const value = features[feature];
  if (value === false) {
    throw new PlanTierError(feature);
  }
}
