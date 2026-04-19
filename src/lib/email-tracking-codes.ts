/**
 * Codes de tracking pour `pending_email_tracking.reminder_day` (INTEGER négatif).
 * Chaque email/SMS marketing merchant a un code unique pour dédup + admin timeline.
 *
 * Convention : codes négatifs pour éviter collision avec reminder_day positifs
 * (qui peuvent exister pour des systèmes legacy).
 */

export const TRACKING_CODES = {
  // Trial onboarding
  WELCOME: -200,
  PROGRAM_REMINDER_J1: -301,
  VITRINE_REMINDER_J3: -304,
  PLANNING_REMINDER_J4: -308,
  SOCIAL_PROOF_J3: -310,
  ACTIVATION_STALLED: -320,

  // Upgrade paywall (Fidélité → Tout-en-un)
  UPGRADE_SMS_CAMPAIGN_BLOCKED: -330,
  UPGRADE_BOOKING_REQUEST_MANUAL: -331,

  // Trial ending / expired / churn
  TRIAL_ENDING_J2: -201,
  TRIAL_EXPIRED_J1: -211,
  CHURN_SURVEY_REMINDER: -213,

  // Grace period
  GRACE_PERIOD_SETUP: -113,
} as const;

export type TrackingCode = (typeof TRACKING_CODES)[keyof typeof TRACKING_CODES];
