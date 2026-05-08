/**
 * GET /api/cron/sms-verify (toutes les 10 min)
 *
 * Resout les sms_logs en status 'pending_verify' :
 * - Si delivery_status='delivered' (DLR webhook arrive entre temps) → marquer 'sent' final
 * - Si delivery_status='not_delivered' → fallback OVH (déjà géré par le webhook DLR, normalement)
 * - Si delivery_status='waiting' → patienter (re-check au prochain tick)
 * - Si delivery_status NULL et verify_after passé → fallback OVH (DLR jamais arrivé)
 *
 * Backstop pour les cas où le webhook DLR n'est pas configuré ou perdu.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendSms } from '@/lib/ovh-sms';
import { classifyOvhError } from '@/lib/sms-error-classifier';
import logger from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabase = getSupabaseAdmin();

// Chaque row peut faire un sendSms (8s × 3 retries = 24s worst-case).
// Avec un budget total de 60s, on parallelise par chunks de 5 et on coupe
// l'avance avant le timeout. Batch de 30 pour rester safe au pire cas.
const BATCH_LIMIT = 30;
const CONCURRENCY = 5;
const TIME_BUDGET_MS = 50 * 1000; // 50s sur 60s, garde 10s pour finaliser

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    delivered_confirmed: 0,
    fallback_ovh_success: 0,
    fallback_ovh_failed: 0,
    waiting_skipped: 0,
    errors: 0,
  };

  // Pick les pending_verify dont verify_after est passé (typiquement créés il y a >10min)
  const { data: pending } = await supabase
    .from('sms_logs')
    .select('id, phone_to, message_body, delivery_status, slot_id, sms_type, merchant_id')
    .eq('status', 'pending_verify')
    .lte('verify_after', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, results });
  }

  type Row = typeof pending[number];

  const processRow = async (row: Row): Promise<void> => {
    if (row.delivery_status === 'delivered') {
      await supabase.from('sms_logs').update({ status: 'sent' }).eq('id', row.id);
      results.delivered_confirmed++;
      return;
    }
    if (row.delivery_status === 'waiting') {
      await supabase
        .from('sms_logs')
        .update({ verify_after: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
        .eq('id', row.id);
      results.waiting_skipped++;
      return;
    }

    // DLR not_delivered ou jamais arrive → fallback OVH
    const r = await sendSms(row.phone_to, row.message_body, 'transactional');
    if (r.success) {
      await supabase.from('sms_logs').update({
        status: 'sent',
        provider: 'ovh',
        provider_msg_id: r.jobId || null,
        ovh_job_id: r.jobId || null,
        error_class: 'success',
        error_message: null,
        fallback_attempted_at: new Date().toISOString(),
      }).eq('id', row.id);
      results.fallback_ovh_success++;
    } else {
      await supabase.from('sms_logs').update({
        status: 'failed',
        error_class: classifyOvhError(r),
        error_message: `[sms_partner timeout] | [ovh fallback] ${r.error || 'unknown'}`,
        fallback_attempted_at: new Date().toISOString(),
      }).eq('id', row.id);
      results.fallback_ovh_failed++;
    }
  };

  // Process en chunks de CONCURRENCY avec early exit sur time budget
  const startedAt = Date.now();
  let aborted = false;
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      logger.warn('[cron sms-verify] time budget exceeded, early exit', { processed: results.processed, total: pending.length });
      aborted = true;
      break;
    }
    const chunk = pending.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(chunk.map(async (row) => {
      results.processed++;
      try { await processRow(row); }
      catch (err) {
        results.errors++;
        logger.error('[cron sms-verify] row error', { id: row.id, err: String(err) });
      }
    }));
    void settled;
  }

  logger.info('[cron sms-verify] done', { ...results, aborted });
  return NextResponse.json({ ok: true, results, aborted });
}
