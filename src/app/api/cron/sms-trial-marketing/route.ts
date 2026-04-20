/**
 * Cron horaire SMS marketing trial (plan v2 emails+SMS).
 * Voir docs/email-sms-trial-plan.md §5.
 *
 * 3 sections :
 * 1. Célébration — détecte 1er aha event (visit/booking/vitrine), envoie 1 SMS dedup global
 * 2. Pre-loss J-1 — merchants ≥S1 dont trial finit dans 24h, copy tier-aware
 * 3. Churn survey — merchants fully expired ≥5j sans avoir rempli le survey
 *
 * Gating commun : opt-out, no_contact, unsubscribed, plage légale FR 10h-20h.
 * Frequency cap intra-cron : on n'envoie pas 2 SMS au même merchant dans la même run.
 */

export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { computeActivationScore } from '@/lib/activation-score';
import { recommendTierForMerchant } from '@/lib/trial-tier-reco';
import {
  sendTrialMarketingSms,
  type TierRecommended,
} from '@/lib/sms-trial-marketing';
import {
  checkInSmsSelection,
  preLossSmsBody,
  churnSurveySmsBody,
} from '@/lib/trial-sms-copy';
import { TRIAL_MARKETING_CUTOFF } from '@/lib/trial-marketing-cutoff';
import { getTrialStatus } from '@/lib/utils';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MerchantRow {
  id: string;
  shop_name: string;
  phone: string;
  country: string;
  created_at: string;
  bio: string | null;
  shop_address: string | null;
  trial_ends_at: string | null;
  subscription_status: string;
  churn_survey_seen_at: string | null;
  no_contact: boolean;
  email_unsubscribed_at: string | null;
  marketing_sms_opted_out: boolean;
  celebration_sms_sent_at: string | null;
  pre_loss_sms_sent_at: string | null;
  churn_sms_sent_at: string | null;
}

const SELECT = 'id, shop_name, phone, country, created_at, bio, shop_address, trial_ends_at, subscription_status, churn_survey_seen_at, no_contact, email_unsubscribed_at, marketing_sms_opted_out, celebration_sms_sent_at, pre_loss_sms_sent_at, churn_sms_sent_at';

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    celebration: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    preLoss: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    churnSurvey: { processed: 0, sent: 0, skipped: 0, errors: 0 },
  };

  // Frequency cap intra-cron : un merchant ne reçoit pas 2 SMS dans la même run
  const sentThisRun = new Set<string>();

  // ==================== SECTION 1 — CHECK-IN 48H ====================
  // Merchants créés il y a ≥48h, en trial, sans celebration_sms_sent_at, créés
  // APRÈS le cutoff. Le SMS choisit la variante selon l'état d'activation :
  // - checkin_nudge : rien configuré (S0)
  // - celebration_fidelity / vitrine : 1 pilier atteint (next step teaser)
  // - checkin_combo : 2+ piliers atteints (célébration complète)
  const CHECK_IN_HOURS = 48;
  const checkInThreshold = new Date(Date.now() - CHECK_IN_HOURS * 60 * 60 * 1000);

  try {
    const { data: trialMerchants } = await supabase
      .from('merchants')
      .select(SELECT)
      .eq('subscription_status', 'trial')
      .is('celebration_sms_sent_at', null)
      .gte('created_at', TRIAL_MARKETING_CUTOFF.toISOString())
      .lte('created_at', checkInThreshold.toISOString())
      .eq('marketing_sms_opted_out', false)
      .eq('no_contact', false);

    for (const merchant of (trialMerchants as MerchantRow[]) || []) {
      results.celebration.processed++;

      try {
        const activation = await computeActivationScore(supabase, {
          id: merchant.id,
          bio: merchant.bio,
          shop_address: merchant.shop_address,
        });

        const { smsType, body } = checkInSmsSelection(activation, merchant.shop_name);

        const result = await sendTrialMarketingSms({
          supabase,
          merchant,
          smsType,
          body,
          stateSnapshot: activation.score,
        });

        if (result.success) {
          results.celebration.sent++;
          sentThisRun.add(merchant.id);
        } else if (result.skipped) {
          results.celebration.skipped++;
        } else {
          results.celebration.errors++;
        }
      } catch (err) {
        results.celebration.errors++;
        logger.error('checkin_sms_failed', { merchantId: merchant.id, err: String(err) });
      }
    }
  } catch (err) {
    logger.error('checkin_section_failed', { err: String(err) });
  }

  // ==================== SECTION 2 — PRE-LOSS J-1 ====================
  // Merchants en trial dont trial finit dans ~24h, ≥S1, créés APRÈS le cutoff.
  // Dedup via flag col pre_loss_sms_sent_at (filtré en SQL + re-vérifié dans gating).
  try {
    const { data: trialMerchants } = await supabase
      .from('merchants')
      .select(SELECT)
      .eq('subscription_status', 'trial')
      .is('pre_loss_sms_sent_at', null)
      .gte('created_at', TRIAL_MARKETING_CUTOFF.toISOString())
      .eq('marketing_sms_opted_out', false)
      .eq('no_contact', false);

    for (const merchant of (trialMerchants as MerchantRow[]) || []) {
      if (sentThisRun.has(merchant.id)) continue;
      results.preLoss.processed++;

      try {
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        // J-1 : actif et exactement 1 jour restant
        if (!trialStatus.isActive || trialStatus.daysRemaining !== 1) {
          results.preLoss.skipped++;
          continue;
        }

        const [activation, recommendedTier, customersRes, bookingsRes] = await Promise.all([
          computeActivationScore(supabase, {
            id: merchant.id,
            bio: merchant.bio,
            shop_address: merchant.shop_address,
          }),
          recommendTierForMerchant(supabase, merchant.id) as Promise<TierRecommended>,
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
          supabase.from('merchant_planning_slots').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id).eq('booked_online', true),
        ]);

        if (activation.score < 1) {
          results.preLoss.skipped++;
          continue;
        }

        const body = preLossSmsBody(merchant.shop_name, recommendedTier, {
          customerCount: customersRes.count ?? 0,
          bookingCount: bookingsRes.count ?? 0,
        });

        const result = await sendTrialMarketingSms({
          supabase,
          merchant,
          smsType: 'trial_pre_loss',
          body,
          stateSnapshot: activation.score,
          tierRecommended: recommendedTier,
        });

        if (result.success) {
          results.preLoss.sent++;
          sentThisRun.add(merchant.id);
        } else if (result.skipped) {
          results.preLoss.skipped++;
        } else {
          results.preLoss.errors++;
        }
      } catch (err) {
        results.preLoss.errors++;
        logger.error('pre_loss_sms_failed', { merchantId: merchant.id, err: String(err) });
      }
    }
  } catch (err) {
    logger.error('pre_loss_section_failed', { err: String(err) });
  }

  // ==================== SECTION 3 — CHURN SURVEY ====================
  // Merchants fully expired ≥5j (donc ≥8j après trial_ends_at, vu la grace 3j),
  // sans churn_survey_seen_at, créés APRÈS le cutoff.
  // Dedup via flag col churn_sms_sent_at.
  try {
    const { data: expiredMerchants } = await supabase
      .from('merchants')
      .select(SELECT)
      .eq('subscription_status', 'trial')
      .is('churn_survey_seen_at', null)
      .is('churn_sms_sent_at', null)
      .gte('created_at', TRIAL_MARKETING_CUTOFF.toISOString())
      .eq('marketing_sms_opted_out', false)
      .eq('no_contact', false);

    for (const merchant of (expiredMerchants as MerchantRow[]) || []) {
      if (sentThisRun.has(merchant.id)) continue;
      results.churnSurvey.processed++;

      try {
        const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
        // Fully expired ≥5j (after grace period 3j → trial ended ≥8j ago)
        if (!trialStatus.isFullyExpired) {
          results.churnSurvey.skipped++;
          continue;
        }
        const daysExpired = Math.abs(trialStatus.daysRemaining);
        if (daysExpired < 5) {
          results.churnSurvey.skipped++;
          continue;
        }

        const body = churnSurveySmsBody(merchant.shop_name);

        const result = await sendTrialMarketingSms({
          supabase,
          merchant,
          smsType: 'churn_survey',
          body,
        });

        if (result.success) {
          results.churnSurvey.sent++;
          sentThisRun.add(merchant.id);
        } else if (result.skipped) {
          results.churnSurvey.skipped++;
        } else {
          results.churnSurvey.errors++;
        }
      } catch (err) {
        results.churnSurvey.errors++;
        logger.error('churn_survey_sms_failed', { merchantId: merchant.id, err: String(err) });
      }
    }
  } catch (err) {
    logger.error('churn_survey_section_failed', { err: String(err) });
  }

  return NextResponse.json({ ok: true, results });
}
