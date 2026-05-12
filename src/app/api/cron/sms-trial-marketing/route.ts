/**
 * Cron horaire SMS marketing trial (plan v2 emails+SMS).
 * Voir docs/email-sms-trial-plan.md §5.
 *
 * 2 sections :
 * 0. Exemple vitrine — T+15min après signup, lien vers vitrine exemple + WhatsApp support
 * 1. Célébration — check-in J+1 (24h), détecte 1er aha event, envoie 1 SMS dedup global
 *
 * Gating commun : opt-out, no_contact, unsubscribed, plage légale FR 10h-20h.
 * Frequency cap intra-cron : on n'envoie pas 2 SMS au même merchant dans la même run.
 */

export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { computeActivationScoresBatch } from '@/lib/activation-score';
import { sendTrialMarketingSms } from '@/lib/sms-trial-marketing';
import {
  checkInSmsSelection,
  exampleVitrineSmsBody,
} from '@/lib/trial-sms-copy';
import { TRIAL_MARKETING_CUTOFF } from '@/lib/trial-marketing-cutoff';
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
  no_contact: boolean;
  email_unsubscribed_at: string | null;
  marketing_sms_opted_out: boolean;
  example_vitrine_sms_sent_at: string | null;
  celebration_sms_sent_at: string | null;
}

const SELECT = 'id, shop_name, phone, country, created_at, bio, shop_address, trial_ends_at, subscription_status, no_contact, email_unsubscribed_at, marketing_sms_opted_out, example_vitrine_sms_sent_at, celebration_sms_sent_at';

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    exampleVitrine: { processed: 0, sent: 0, skipped: 0, errors: 0 },
    checkIn: { processed: 0, sent: 0, skipped: 0, errors: 0 },
  };

  // Frequency cap intra-cron : un merchant ne reçoit pas 2 SMS dans la même run
  const sentThisRun = new Set<string>();

  // ==================== SECTION 0 — EXEMPLE DE VITRINE (T+15min) ====================
  // Merchants créés il y a ≥15 min et ≤24h (fenêtre large car cron horaire),
  // sans example_vitrine_sms_sent_at, créés APRÈS le cutoff.
  const EXAMPLE_VITRINE_MIN_MINUTES = 15;
  const EXAMPLE_VITRINE_MAX_HOURS = 24;
  const newestEligible = new Date(Date.now() - EXAMPLE_VITRINE_MIN_MINUTES * 60 * 1000);
  const oldestEligible = new Date(Date.now() - EXAMPLE_VITRINE_MAX_HOURS * 60 * 60 * 1000);

  try {
    const { data: newMerchants } = await supabase
      .from('merchants')
      .select(SELECT)
      .is('example_vitrine_sms_sent_at', null)
      .gte('created_at', TRIAL_MARKETING_CUTOFF.toISOString())
      .gte('created_at', oldestEligible.toISOString())
      .lte('created_at', newestEligible.toISOString())
      .eq('marketing_sms_opted_out', false)
      .eq('no_contact', false);

    for (const merchant of (newMerchants as MerchantRow[]) || []) {
      results.exampleVitrine.processed++;
      try {
        const body = exampleVitrineSmsBody(merchant.shop_name);
        const result = await sendTrialMarketingSms({
          supabase,
          merchant,
          smsType: 'example_vitrine',
          body,
        });

        if (result.success) {
          results.exampleVitrine.sent++;
          sentThisRun.add(merchant.id);
        } else if (result.skipped) {
          results.exampleVitrine.skipped++;
        } else {
          results.exampleVitrine.errors++;
        }
      } catch (err) {
        results.exampleVitrine.errors++;
        logger.error('example_vitrine_sms_failed', { merchantId: merchant.id, err: String(err) });
      }
    }
  } catch (err) {
    logger.error('example_vitrine_section_failed', { err: String(err) });
  }

  // ==================== SECTION 1 — CHECK-IN J+1 ====================
  // Merchants créés il y a ≥24h, en trial, sans celebration_sms_sent_at, créés
  // APRÈS le cutoff. Le SMS choisit la variante selon l'état d'activation :
  // - checkin_nudge : rien configuré (S0)
  // - celebration_fidelity / vitrine : 1 pilier atteint (next step teaser)
  // - checkin_combo : 2+ piliers atteints (célébration complète)
  const CHECK_IN_HOURS = 24;
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

    const rows = (trialMerchants as MerchantRow[]) || [];
    // Batch activation scores (N×3 queries parallèles au lieu de N séquentiels)
    const activationMap = await computeActivationScoresBatch(
      supabase,
      rows.map(m => ({ id: m.id, bio: m.bio, shop_address: m.shop_address })),
    );

    for (const merchant of rows) {
      if (sentThisRun.has(merchant.id)) continue;
      results.checkIn.processed++;
      try {
        const activation = activationMap.get(merchant.id)!;
        const { smsType, body } = checkInSmsSelection(activation, merchant.shop_name);

        const result = await sendTrialMarketingSms({
          supabase,
          merchant,
          smsType,
          body,
          stateSnapshot: activation.score,
        });

        if (result.success) {
          results.checkIn.sent++;
          sentThisRun.add(merchant.id);
        } else if (result.skipped) {
          results.checkIn.skipped++;
        } else {
          results.checkIn.errors++;
        }
      } catch (err) {
        results.checkIn.errors++;
        logger.error('checkin_sms_failed', { merchantId: merchant.id, err: String(err) });
      }
    }
  } catch (err) {
    logger.error('checkin_section_failed', { err: String(err) });
  }

  return NextResponse.json({ ok: true, results });
}
