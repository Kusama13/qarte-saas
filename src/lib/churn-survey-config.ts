// Shared enum values + labels used across API Zod schema, merchant questionnaire,
// and admin list. Single source of truth.

export const BLOCKER_VALUES = [
  'price',
  'not_enough_clients',
  'missing_feature',
  'too_complex',
  'other',
] as const;

export const CONVINCE_VALUES = [
  'lower_price',
  'longer_trial',
  'team_demo',
  'more_features',
  'fidelity_tier_ok',
  'nothing',
] as const;

export const FEATURE_VALUES = [
  'loyalty',
  'planning',
  'online_booking',
  'sms',
  'push_offers',
  'referral',
] as const;

/** Features Tout-en-un non dispo dans Fidélité — collectées via Q3bis pour merchants fidélité. */
export const WANTED_UNAVAILABLE_VALUES = [
  'planning',
  'online_booking',
  'sms_marketing',
  'contest',
  'member_programs',
] as const;

export type ChurnBlocker = (typeof BLOCKER_VALUES)[number];
export type ChurnConvince = (typeof CONVINCE_VALUES)[number];
export type ChurnFeature = (typeof FEATURE_VALUES)[number];
export type ChurnWantedUnavailable = (typeof WANTED_UNAVAILABLE_VALUES)[number];

// Mapping from snake_case DB values to camelCase translation keys
export const CONVINCE_VARIANT_KEYS: Record<ChurnConvince, string> = {
  lower_price: 'lowerPrice',
  longer_trial: 'longerTrial',
  team_demo: 'teamDemo',
  more_features: 'moreFeatures',
  fidelity_tier_ok: 'fidelityTierOk',
  nothing: 'nothing',
};

// French-only labels for admin page (clients use i18n via next-intl).
// Keep in sync with messages/fr.json churnSurvey namespace.
export const BLOCKER_LABELS_FR: Record<ChurnBlocker, string> = {
  price: 'Prix trop élevé',
  not_enough_clients: 'Pas assez de clientes',
  missing_feature: 'Fonctionnalité manquante',
  too_complex: 'Trop compliqué',
  other: 'Autre',
};

export const CONVINCE_LABELS_FR: Record<ChurnConvince, string> = {
  lower_price: 'Prix plus bas',
  longer_trial: 'Essai plus long',
  team_demo: 'Démo avec équipe',
  more_features: 'Plus de fonctionnalités',
  fidelity_tier_ok: 'Tier Fidélité 19€ suffisant',
  nothing: 'Rien',
};

export const FEATURE_LABELS_FR: Record<ChurnFeature, string> = {
  loyalty: 'Fidélité',
  planning: 'Planning',
  online_booking: 'Résa en ligne',
  sms: 'SMS',
  push_offers: 'Push / offres',
  referral: 'Parrainage',
};

export const WANTED_UNAVAILABLE_LABELS_FR: Record<ChurnWantedUnavailable, string> = {
  planning: 'Planning',
  online_booking: 'Réservation en ligne',
  sms_marketing: 'Campagnes SMS',
  contest: 'Jeux concours',
  member_programs: 'Programmes membres',
};

// Trigger for the admin page badges + merchant card colors
export const BLOCKER_BADGE_CLASSES: Record<ChurnBlocker, string> = {
  price: 'bg-amber-50 text-amber-700 border-amber-200',
  not_enough_clients: 'bg-blue-50 text-blue-700 border-blue-200',
  missing_feature: 'bg-violet-50 text-violet-700 border-violet-200',
  too_complex: 'bg-rose-50 text-rose-700 border-rose-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
};

// Reciprocity : merchant who selects "lower_price" unlocks a Stripe promo code.
// Must match a coupon created manually in the Stripe dashboard.
export const CHURN_PROMO_CODE = '3MOISQARTEPRO25';
export const CHURN_BONUS_DAYS_DEFAULT = 2;

// Bonus days vary by Q4 answer
export const CHURN_BONUS_DAYS_BY_CONVINCE: Record<ChurnConvince, number> = {
  lower_price: 2,
  longer_trial: 7,
  team_demo: 5,
  more_features: 2,
  fidelity_tier_ok: 5,
  nothing: 2,
};
