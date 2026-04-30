/**
 * Cron horaire — auto-cancel les bons cadeaux en pending_payment depuis > 3 jours.
 *
 * Si l'offreur n'a pas payé sous 3 jours après la commande, on annule pour ne
 * pas polluer le dashboard merchant. Pas de remboursement géré (paiement
 * externe). Pas de notification automatique à l'offreur (l'email initial l'a
 * déjà prévenu).
 *
 * Marquage : status='cancelled', cancelled_at=NOW(), cancellation_reason='auto_expired_3d'
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

  try {
    const cutoff = new Date(Date.now() - GIFT_CARD_AUTO_CANCEL_DAYS * 24 * 60 * 60 * 1000);

    const { data: stale, error: fetchError } = await supabase
      .from('gift_cards')
      .select('id')
      .eq('status', 'pending_payment')
      .lt('created_at', cutoff.toISOString())
      .limit(500);

    if (fetchError) {
      logger.error('Gift cards expire cron — fetch error', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!stale || stale.length === 0) {
      return NextResponse.json({ success: true, cancelled: 0, elapsedMs: Date.now() - start });
    }

    const ids = stale.map((g) => g.id);
    const { error: updateError } = await supabase
      .from('gift_cards')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'auto_expired_3d',
      })
      .in('id', ids)
      .eq('status', 'pending_payment');  // anti-race

    if (updateError) {
      logger.error('Gift cards expire cron — update error', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    const elapsedMs = Date.now() - start;
    logger.info('Gift cards expire cron completed', { cancelled: ids.length, elapsedMs });
    return NextResponse.json({ success: true, cancelled: ids.length, elapsedMs });
  } catch (err) {
    logger.error('Gift cards expire cron error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
