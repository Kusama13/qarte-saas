/**
 * Cron horaire — 3 passes :
 *   1. Reminder J-7 : pour chaque bon cadeau actif qui expire dans <= 7 jours
 *      ET dont expiry_reminder_sent_at est NULL, envoyer 1 SMS au destinataire
 *      et marquer expiry_reminder_sent_at = now() (anti-double-envoi).
 *   2. Auto-cancel les bons cadeaux en pending_payment depuis > 3 jours
 *      (l'offreur n'a pas payé). status='cancelled', cancellation_reason='auto_expired_3d'.
 *   3. Auto-expire les bons cadeaux active dont expires_at <= now()
 *      (la durée de validité — `merchant.gift_card_expiry_months`, défaut 3 — est passée).
 *      status='expired'. ET supprime le voucher correspondant dans `vouchers`
 *      pour qu'il n'apparaisse plus dans la carte fidélité de la cliente.
 *
 * À déclencher 1×/heure depuis vercel.json (lag max 1h).
 */

export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { GIFT_CARD_AUTO_CANCEL_DAYS, resolveGiftCardServiceNames } from '@/lib/gift-cards';
import { sendBookingSms } from '@/lib/sms';
import { formatCurrencyForSms, formatLongDate } from '@/lib/utils';
import type { GiftCardServiceSnapshot } from '@/types';
import logger from '@/lib/logger';

const REMINDER_DAYS_BEFORE_EXPIRY = 7;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const nowIso = new Date().toISOString();
  let remindersSent = 0;
  let cancelled = 0;
  let expired = 0;
  let vouchersDeleted = 0;

  try {
    // ─── PASSE 0 : J-7 reminder SMS au destinataire ───
    const reminderCutoff = new Date(Date.now() + REMINDER_DAYS_BEFORE_EXPIRY * 24 * 60 * 60 * 1000);
    const { data: dueReminders } = await supabase
      .from('gift_cards')
      .select(`
        id, amount, kind, service_ids, service_snapshot,
        recipient_first_name, recipient_phone, expires_at, merchant_id,
        merchants!inner (
          shop_name, country, locale, subscription_status, past_due_since
        )
      `)
      .eq('status', 'active')
      .is('expiry_reminder_sent_at', null)
      .not('expires_at', 'is', null)
      .gt('expires_at', nowIso)
      .lte('expires_at', reminderCutoff.toISOString())
      .limit(200);

    type ReminderRow = {
      id: string; amount: number; kind: string;
      service_ids: string[] | null;
      service_snapshot: GiftCardServiceSnapshot[] | null;
      recipient_first_name: string; recipient_phone: string;
      expires_at: string; merchant_id: string;
      merchants: {
        shop_name: string; country: string; locale: string;
        subscription_status: string | null;
        past_due_since: string | null;
      };
    };

    if (dueReminders && dueReminders.length > 0) {
      const rows = dueReminders as unknown as ReminderRow[];
      const processedIds: string[] = [];
      const results = await Promise.allSettled(
        rows.map(async (gc) => {
          const lang = (gc.merchants.locale || 'fr') as 'fr' | 'en';
          const { servicesLabel } = await resolveGiftCardServiceNames(
            supabase, gc.merchant_id, gc.kind, gc.service_ids, gc.service_snapshot,
          );
          await sendBookingSms(supabase, {
            merchantId: gc.merchant_id,
            phone: gc.recipient_phone,
            shopName: gc.merchants.shop_name,
            smsType: 'gift_card_expiry_reminder',
            locale: lang,
            subscriptionStatus: gc.merchants.subscription_status || 'active',
            pastDueSince: gc.merchants.past_due_since,
            date: formatLongDate(new Date(gc.expires_at), lang),
            giftRecipientName: gc.recipient_first_name,
            giftAmount: formatCurrencyForSms(Number(gc.amount), gc.merchants.country),
            giftServicesLabel: servicesLabel,
          });
          processedIds.push(gc.id);
        }),
      );
      remindersSent = results.filter((r) => r.status === 'fulfilled').length;
      // Anti-double-envoi : on marque même si le SMS a échoué (numéro invalide).
      // Batch single UPDATE après le Promise.allSettled.
      if (processedIds.length > 0) {
        await supabase
          .from('gift_cards')
          .update({ expiry_reminder_sent_at: new Date().toISOString() })
          .in('id', processedIds);
      }
    }

    // ─── PASSE 1 : pending_payment > 3j → cancelled ───
    const cancelCutoff = new Date(Date.now() - GIFT_CARD_AUTO_CANCEL_DAYS * 24 * 60 * 60 * 1000);
    const { data: stalePending } = await supabase
      .from('gift_cards')
      .select('id')
      .eq('status', 'pending_payment')
      .lt('created_at', cancelCutoff.toISOString())
      .limit(500);

    if (stalePending && stalePending.length > 0) {
      const ids = stalePending.map((g) => g.id);
      const { error: cancelErr } = await supabase
        .from('gift_cards')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          cancellation_reason: 'auto_expired_3d',
        })
        .in('id', ids)
        .eq('status', 'pending_payment'); // anti-race
      if (cancelErr) {
        logger.error('Gift cards expire cron — cancel pending error', cancelErr);
      } else {
        cancelled = ids.length;
      }
    }

    // ─── PASSE 2 : active dont expires_at échue → expired + drop voucher ───
    const { data: dueExpired } = await supabase
      .from('gift_cards')
      .select('id, voucher_id, code')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', nowIso)
      .limit(500);

    if (dueExpired && dueExpired.length > 0) {
      const giftIds = dueExpired.map((g) => g.id);
      const voucherIds = dueExpired
        .map((g) => g.voucher_id)
        .filter((id): id is string => Boolean(id));

      // Atomic mark expired (anti-race avec un consume manuel)
      const { data: claimed, error: expireErr } = await supabase
        .from('gift_cards')
        .update({ status: 'expired' })
        .in('id', giftIds)
        .eq('status', 'active')
        .select('id, voucher_id');
      if (expireErr) {
        logger.error('Gift cards expire cron — expire active error', expireErr);
      } else if (claimed) {
        expired = claimed.length;
        const claimedVoucherIds = claimed
          .map((g) => g.voucher_id as string | null)
          .filter((id): id is string => Boolean(id));

        if (claimedVoucherIds.length > 0) {
          // Retire le voucher de la carte fidélité du destinataire (le bon
          // a expiré, il ne doit plus apparaître comme une récompense
          // disponible dans son espace cliente).
          const { error: vDelErr, count } = await supabase
            .from('vouchers')
            .delete({ count: 'exact' })
            .in('id', claimedVoucherIds);
          if (vDelErr) {
            logger.error('Gift cards expire cron — delete vouchers error', vDelErr);
          } else {
            vouchersDeleted = count || 0;
          }
        }
      }
    }

    const elapsedMs = Date.now() - start;
    logger.info('Gift cards expire cron completed', {
      remindersSent, cancelled, expired, vouchersDeleted, elapsedMs,
    });
    return NextResponse.json({
      success: true,
      remindersSent,
      cancelled,
      expired,
      vouchersDeleted,
      elapsedMs,
    });
  } catch (err) {
    logger.error('Gift cards expire cron error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
