/**
 * Codes de tracking pour `pending_email_tracking.reminder_day` (INTEGER négatif).
 * Chaque email/SMS marketing merchant a un code unique pour dédup + admin timeline.
 *
 * Convention : codes négatifs pour éviter collision avec reminder_day positifs
 * (qui peuvent exister pour des systèmes legacy).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const TRACKING_CODES = {
  // Trial onboarding
  WELCOME: -200,
  QR_CODE_SENT: -103, // kit QR "tout est prêt — lance ton programme" (dédup cron + routes admin/self-serve)
  PROGRAM_REMINDER_J1: -301,
  VITRINE_REMINDER_J3: -304,
  PLANNING_REMINDER_J4: -308,
  SOCIAL_PROOF_J3: -310,
  ACTIVATION_STALLED: -320,

  // Upgrade paywall (Fidélité → Tout-en-un)
  UPGRADE_SMS_CAMPAIGN_BLOCKED: -330,
  UPGRADE_BOOKING_REQUEST_MANUAL: -331,

  // Trial ending / expired (cadence 3j)
  // TRIAL_ENDING fires sur le 1er morning où daysRemaining===2 (J+1 ou J+2 selon heure signup).
  // TRIAL_FINAL_DAY fires sur le 1er morning où daysRemaining===1 (J+2 ou J+3 selon heure signup).
  TRIAL_ENDING_J2: -201,
  TRIAL_FINAL_DAY_J3: -212,
  TRIAL_EXPIRED_J1: -211,

  // Grace period
  GRACE_PERIOD_SETUP: -113,
} as const;

export type TrackingCode = (typeof TRACKING_CODES)[keyof typeof TRACKING_CODES];

/** Un email a-t-il déjà été tracé pour ce merchant + code ? (dédup mono-marchand) */
export async function wasEmailSent(supabase: SupabaseClient, merchantId: string, code: number): Promise<boolean> {
  const { data } = await supabase
    .from('pending_email_tracking')
    .select('merchant_id')
    .eq('merchant_id', merchantId)
    .eq('reminder_day', code)
    .maybeSingle();
  return !!data;
}

/** Trace un email envoyé (dédup). `ignoreDuplicates` : conserve le 1er sent_at, ne lève pas sur doublon. */
export async function markEmailSent(supabase: SupabaseClient, merchantId: string, code: number): Promise<void> {
  await supabase
    .from('pending_email_tracking')
    .upsert(
      { merchant_id: merchantId, reminder_day: code, pending_count: 0 },
      { onConflict: 'merchant_id,reminder_day', ignoreDuplicates: true },
    );
}
