import type { Merchant, PlanTier, PlanningIntent, SubscriptionStatus } from '@/types';

/**
 * Plan tiers Qarte (avril 2026).
 * - fidelity (19€/190€) : fidélité seule. Pas de planning, résa, ni campagnes SMS manuelles.
 *   SMS auto (anniversaire, parrainage récompense) envoyés sans quota — coût absorbé.
 * - all_in (24€/240€) : full features. 100 SMS marketing/mois (compteur unique pour
 *   anniversaire + parrainage + auto + campagnes manuelles).
 *
 * Pendant le trial, tous les merchants ont accès all_in (sauf SMS sortants déjà gated par PAID_STATUSES).
 * Le tier choisi au checkout détermine ce qui reste accessible une fois abonné.
 */

export interface PlanFeatures {
  /** Quota mensuel pour SMS marketing comptabilisés. 0 pour Fidélité (les SMS auto inclus
   *  ne comptent pas — voir FIDELITY_FREE_SMS_TYPES dans sms.ts). */
  smsQuota: number;
  planning: boolean;
  bookingOnline: boolean;
  marketingSms: boolean;
  memberPrograms: boolean;
  contest: boolean;
}

export const PLAN_TIERS: Record<PlanTier, PlanFeatures> = {
  fidelity: {
    smsQuota: 0,
    planning: false,
    bookingOnline: false,
    marketingSms: false,
    memberPrograms: false,
    contest: false,
  },
  all_in: {
    smsQuota: 100,
    planning: true,
    bookingOnline: true,
    marketingSms: true,
    memberPrograms: true,
    contest: true,
  },
};

type MerchantLike = Pick<Merchant, 'subscription_status' | 'plan_tier'> | {
  subscription_status?: SubscriptionStatus | string | null;
  plan_tier?: PlanTier | string | null;
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
  return PLAN_TIERS[tier];
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
