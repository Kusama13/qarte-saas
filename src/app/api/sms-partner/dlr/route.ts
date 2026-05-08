/**
 * POST /api/sms-partner/dlr
 *
 * Webhook DLR (Delivery Report) appele par SMS Partner quand le statut d'un
 * SMS change. Pas de signature HMAC documentee → on protege par un secret
 * partage en query string (?secret=...).
 *
 * Format payload SMS Partner (cf docpartner.dev) :
 *   {
 *     status: 'delivered' | 'not delivered' | 'waiting',
 *     msgId: '11111111',
 *     date: 1764768485,
 *     phone: '+33...',
 *     cost: '0.049',
 *     currency: 'EUR',
 *     tag: '...'
 *   }
 *
 * Comportement :
 * - Lookup `sms_logs WHERE provider='sms_partner' AND provider_msg_id=msgId`
 * - Update `delivery_status` + `dlr_received_at`
 * - Si `status='delivered'` ET `sms_logs.status='pending_verify'` → marque 'sent' (delivere, plus besoin de verify)
 * - Si `status='not delivered'` ET `pending_verify` → trigger fallback OVH (creer un nouveau log + envoyer)
 *
 * Verification authenticite : secret en query string. Pas de signature HMAC
 * cote SMS Partner donc on accepte la moindre garantie. En cas de probleme,
 * regenerer le secret et reconfigurer urlDlr cote SMS Partner dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendSms } from '@/lib/ovh-sms';
import { classifyOvhError } from '@/lib/sms-error-classifier';
import logger from '@/lib/logger';

const DLR_SECRET = (process.env.SMS_PARTNER_DLR_SECRET || '').trim();
const supabase = getSupabaseAdmin();

interface DlrPayload {
  status?: 'delivered' | 'not delivered' | 'waiting' | string;
  msgId?: string | number;
  phone?: string;
  date?: number;
  cost?: string;
  currency?: string;
  tag?: string;
}

export async function POST(request: NextRequest) {
  // 1. Auth via secret en query string
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (!DLR_SECRET || secret !== DLR_SECRET) {
    logger.warn('[sms-partner-dlr] Invalid secret', { ip: request.headers.get('x-forwarded-for') });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. Parse payload JSON (SMS Partner POSTe en JSON cf docpartner.dev).
  let payload: DlrPayload;
  try {
    payload = await request.json();
  } catch (err) {
    logger.error('[sms-partner-dlr] Parse error', { err: String(err) });
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const msgId = payload.msgId ? String(payload.msgId) : null;
  const status = payload.status ? String(payload.status).toLowerCase() : null;

  if (!msgId || !status) {
    logger.warn('[sms-partner-dlr] Missing fields', { payload });
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  // 3. Lookup sms_logs par provider_msg_id
  const { data: log, error: lookupErr } = await supabase
    .from('sms_logs')
    .select('id, status, phone_to, message_body, merchant_id, slot_id, sms_type')
    .eq('provider', 'sms_partner')
    .eq('provider_msg_id', msgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupErr || !log) {
    logger.warn('[sms-partner-dlr] No log found for msgId', { msgId, status });
    // Acquitte quand meme pour eviter retry SMS Partner
    return NextResponse.json({ ok: true, action: 'log_not_found' });
  }

  // 4. Mapping statut SMS Partner → notre delivery_status
  const deliveryStatus =
    status === 'delivered' ? 'delivered' :
    status === 'not delivered' ? 'not_delivered' :
    status === 'waiting' ? 'waiting' :
    null;

  if (!deliveryStatus) {
    logger.info('[sms-partner-dlr] Unknown status, ignored', { status, msgId });
    return NextResponse.json({ ok: true, action: 'unknown_status' });
  }

  const updateRow: Record<string, unknown> = {
    delivery_status: deliveryStatus,
    dlr_received_at: new Date().toISOString(),
  };

  // 5. Decision selon le statut + l'etat actuel du log
  let action = 'noop';

  if (deliveryStatus === 'delivered') {
    // SMS livre → marquer 'sent' (peu importe l'ancien status, c'est confirme par le DLR)
    updateRow.status = 'sent';
    action = 'delivered_confirmed';
  } else if (deliveryStatus === 'not_delivered') {
    // SMS non livre → fallback OVH si pas deja tente
    if (log.status === 'pending_verify' || log.status === 'sent') {
      const r = await sendSms(log.phone_to, log.message_body, 'transactional');
      const errorClass = classifyOvhError(r);
      if (r.success) {
        updateRow.status = 'sent';
        updateRow.provider = 'ovh';
        updateRow.provider_msg_id = r.jobId || null;
        updateRow.ovh_job_id = r.jobId || null;
        updateRow.error_class = 'success';
        updateRow.error_message = null;
        updateRow.fallback_attempted_at = new Date().toISOString();
        action = 'fallback_ovh_success';
      } else {
        updateRow.status = 'failed';
        updateRow.error_class = errorClass;
        updateRow.error_message = `[sms_partner] not_delivered | [ovh fallback] ${r.error || 'unknown'}`;
        updateRow.fallback_attempted_at = new Date().toISOString();
        action = 'fallback_ovh_failed';
      }
    } else {
      // Status='failed' deja, juste tracer le DLR
      action = 'already_failed';
    }
  }
  // 'waiting' : pas d'action immediate (attendre DLR final)

  await supabase.from('sms_logs').update(updateRow).eq('id', log.id);

  logger.info('[sms-partner-dlr] Processed', {
    msgId, status: deliveryStatus, action, smsLogId: log.id, phone: log.phone_to,
  });

  return NextResponse.json({ ok: true, action });
}
