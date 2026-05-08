/**
 * GET /api/cron/sms-batch-audit (19h30 UTC = 21h30 Paris)
 *
 * Filet de securite quotidien : verifie que TOUS les rappels J-1 prevus pour
 * demain ont bien un sms_logs avec status sent/delivered/pending_verify.
 *
 * Le cron evening tourne a 17h UTC (19h Paris) et envoie les reminder_j1.
 * Cet audit tourne 2h30 plus tard pour laisser le temps aux DLR + sms-verify
 * de resoudre les pending. Si un rappel manque encore → re-envoi defensif via OVH.
 *
 * Si > 5% des rappels manquent sur l'ensemble → alerte admin (probleme global).
 *
 * Hors scope : reminder_j0 (envoye dynamiquement H-3, plus difficile a auditer
 * a une heure fixe). On audite seulement reminder_j1 qui a un horaire prevu.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendBookingSms, getGlobalSmsConfig } from '@/lib/sms';
import { getTodayForCountry } from '@/lib/utils';
import { notifySmsAdmin } from '@/lib/sms-admin-alerts';
import logger from '@/lib/logger';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const supabase = getSupabaseAdmin();

const HIGH_MISS_THRESHOLD_PCT = 5; // alerte admin si > 5% manquants

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const results = {
    merchants_checked: 0,
    expected_reminders: 0,
    found_logged: 0,
    missing_resent_ok: 0,
    missing_resent_failed: 0,
    errors: 0,
  };

  // Garde-fou : on ne re-envoie pas defensivement si le cron evening n'a pas
  // tourne dans les 6 dernieres heures. Sinon on enverrait les reminder_j1
  // PREMATUREMENT (avant l'heure prevue par evening). Cas observe lors du
  // test e2e 2026-05-08 ou un trigger manuel a 8h UTC a re-envoye 9 rappels
  // 11h trop tot. Le cron evening ecrit `sms_evening_last_run_at` a la fin
  // de son run.
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const { data: eveningCfg } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'sms_evening_last_run_at')
    .maybeSingle();
  const eveningRanAt = (eveningCfg?.value as { ran_at?: string } | null)?.ran_at;
  if (!eveningRanAt || Date.now() - new Date(eveningRanAt).getTime() > SIX_HOURS_MS) {
    logger.warn('[cron sms-batch-audit] Evening cron has not run in last 6h, skip audit to avoid premature resend', { eveningRanAt });
    return NextResponse.json({
      ok: true,
      skipped: 'evening_not_run_recently',
      eveningRanAt: eveningRanAt || null,
      results,
    });
  }

  try {
    const globalSmsConfig = await getGlobalSmsConfig(supabase);
    if (!globalSmsConfig.reminder_enabled) {
      return NextResponse.json({ ok: true, skipped: 'reminder_disabled', results });
    }

    // 1. Merchants eligibles aux rappels J-1
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, country, locale, subscription_status')
      .in('subscription_status', ['active', 'canceling', 'past_due'])
      .eq('reminder_j1_enabled', true)
      .eq('planning_enabled', true);

    for (const m of merchants || []) {
      results.merchants_checked++;
      try {
        // 2. Slots prevus demain (timezone merchant)
        const today = getTodayForCountry(m.country);
        const tomorrowDate = new Date(today + 'T12:00:00');
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

        const { data: slots } = await supabase
          .from('merchant_planning_slots')
          .select('id, client_phone, start_time, slot_date')
          .eq('merchant_id', m.id)
          .eq('slot_date', tomorrowStr)
          .not('client_name', 'is', null)
          .not('client_phone', 'is', null)
          .is('primary_slot_id', null);

        if (!slots || slots.length === 0) continue;

        // 3. Lookup logs reminder_j1 pour ces slots (en bulk)
        const slotIds = slots.map(s => s.id);
        const { data: existingLogs } = await supabase
          .from('sms_logs')
          .select('slot_id, status, delivery_status')
          .in('slot_id', slotIds)
          .eq('sms_type', 'reminder_j1');

        const loggedSlotIds = new Set(
          (existingLogs || [])
            .filter(l => l.status === 'sent' || l.status === 'delivered' || l.status === 'pending_verify')
            .map(l => l.slot_id),
        );

        // 4. Pour chaque slot sans log valide → re-envoi defensif
        for (const slot of slots) {
          results.expected_reminders++;
          if (loggedSlotIds.has(slot.id)) {
            results.found_logged++;
            continue;
          }
          // Manquant → defensive re-send. sendBookingSms gere lui-meme dedup
          // (unique constraint sur sms_logs si concurrent), retry intelligent, blacklist.
          if (!slot.client_phone) continue;
          const sent = await sendBookingSms(supabase, {
            merchantId: m.id,
            slotId: slot.id,
            phone: slot.client_phone,
            shopName: m.shop_name,
            date: slot.slot_date,
            time: slot.start_time,
            smsType: 'reminder_j1',
            locale: m.locale || 'fr',
            subscriptionStatus: m.subscription_status,
            globalConfig: globalSmsConfig,
          });
          if (sent) results.missing_resent_ok++;
          else results.missing_resent_failed++;
        }
      } catch (err) {
        results.errors++;
        logger.error('[cron sms-batch-audit] merchant error', { merchantId: m.id, err: String(err) });
      }
    }

    // 5. Alerte admin si trop de manquants
    if (results.expected_reminders > 0) {
      const missingCount = results.missing_resent_ok + results.missing_resent_failed;
      const missPct = (missingCount / results.expected_reminders) * 100;
      if (missPct > HIGH_MISS_THRESHOLD_PCT) {
        await notifySmsAdmin(supabase, 'batch_audit_high_miss', {
          message: `L'audit du soir a detecte ${missingCount} rappels J-1 manquants sur ${results.expected_reminders} prevus (${missPct.toFixed(1)}%). Le seuil d'alerte est ${HIGH_MISS_THRESHOLD_PCT}%.`,
          details: {
            'Rappels prevus': results.expected_reminders,
            'Deja loggés': results.found_logged,
            'Re-envoyes OK': results.missing_resent_ok,
            'Re-envoi echec': results.missing_resent_failed,
          },
          cta: { label: 'Voir Vercel logs', url: 'https://vercel.com/judes-projects-967485ba/qarte-saas/logs' },
        });
      }
    }

    logger.info('[cron sms-batch-audit] done', results);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    logger.error('[cron sms-batch-audit] fatal', { err: String(err) });
    return NextResponse.json({ ok: false, results, error: String(err) }, { status: 500 });
  }
}
