/**
 * Cron horaire — 2 passes :
 *   1. Auto-cancel les bons cadeaux en pending_payment depuis > 3 jours
 *      (l'offreur n'a pas payé). status='cancelled', cancellation_reason='auto_expired_3d'.
 *   2. Auto-expire les bons cadeaux active dont expires_at <= now()
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
import { GIFT_CARD_AUTO_CANCEL_DAYS } from '@/lib/gift-cards';
import logger from '@/lib/logger';

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
  let cancelled = 0;
  let expired = 0;
  let vouchersDeleted = 0;

  try {
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
      cancelled, expired, vouchersDeleted, elapsedMs,
    });
    return NextResponse.json({
      success: true,
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
