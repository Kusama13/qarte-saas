export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTodayForCountry } from '@/lib/utils';
import { sendMerchantPush } from '@/lib/merchant-push';
import { verifyCronAuth } from '@/lib/cron-helpers';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Weekly recap — fires Sunday evening. Sends each active merchant with planning_enabled
 * a push summarising next week's bookings (count + estimated revenue).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronStartTime = Date.now();
  const results = { processed: 0, sent: 0, skippedEmpty: 0 };

  try {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, locale, country, subscription_status, no_contact, planning_enabled')
      .eq('planning_enabled', true)
      .in('subscription_status', ['trial', 'active', 'canceling', 'past_due'])
      .eq('no_contact', false);

    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ success: true, elapsedMs: Date.now() - cronStartTime, ...results });
    }

    // Range = [tomorrow, tomorrow+7) in Paris time. Simpler: use today+1 .. today+7 inclusive.
    const merchantIds = merchants.map(m => m.id);
    const todayByMerchant = new Map<string, string>();
    const startByMerchant = new Map<string, string>();
    const endByMerchant = new Map<string, string>();
    for (const m of merchants) {
      const today = getTodayForCountry(m.country);
      todayByMerchant.set(m.id, today);
      const start = new Date(today + 'T00:00:00Z');
      start.setUTCDate(start.getUTCDate() + 1);
      const end = new Date(today + 'T00:00:00Z');
      end.setUTCDate(end.getUTCDate() + 8); // exclusive upper bound (7 days window)
      startByMerchant.set(m.id, start.toISOString().slice(0, 10));
      endByMerchant.set(m.id, end.toISOString().slice(0, 10));
    }

    // Global date range = min..max across merchants (most will share same day in FR/BE/CH)
    const allStarts = [...startByMerchant.values()].sort();
    const allEnds = [...endByMerchant.values()].sort();
    const globalStart = allStarts[0];
    const globalEnd = allEnds[allEnds.length - 1];

    // Fetch all bookings in window for these merchants (one query)
    const { data: slots } = await supabase
      .from('merchant_planning_slots')
      .select('id, merchant_id, slot_date, client_name, primary_slot_id')
      .in('merchant_id', merchantIds)
      .gte('slot_date', globalStart)
      .lt('slot_date', globalEnd)
      .not('client_name', 'is', null)
      .neq('client_name', '__blocked__')
      .is('primary_slot_id', null);

    // Aggregate per merchant (respecting each merchant's own window)
    const countByMerchant = new Map<string, number>();
    const slotIdsByMerchant = new Map<string, string[]>();
    for (const slot of slots || []) {
      const start = startByMerchant.get(slot.merchant_id);
      const end = endByMerchant.get(slot.merchant_id);
      if (!start || !end) continue;
      if (slot.slot_date < start || slot.slot_date >= end) continue;
      countByMerchant.set(slot.merchant_id, (countByMerchant.get(slot.merchant_id) || 0) + 1);
      if (!slotIdsByMerchant.has(slot.merchant_id)) slotIdsByMerchant.set(slot.merchant_id, []);
      slotIdsByMerchant.get(slot.merchant_id)!.push(slot.id);
    }

    // Fetch services (price) for all those slots in one query
    const allSlotIds = [...slotIdsByMerchant.values()].flat();
    const revenueByMerchant = new Map<string, number>();
    if (allSlotIds.length > 0) {
      const { data: slotServices } = await supabase
        .from('planning_slot_services')
        .select('slot_id, service_id')
        .in('slot_id', allSlotIds);

      if (slotServices && slotServices.length > 0) {
        const serviceIds = [...new Set(slotServices.map(s => s.service_id))];
        const { data: services } = await supabase
          .from('services')
          .select('id, merchant_id, price')
          .in('id', serviceIds);

        const priceMap = new Map((services || []).map(s => [s.id, { merchantId: s.merchant_id, price: Number(s.price || 0) }]));
        const slotToMerchant = new Map<string, string>();
        for (const [mid, sids] of slotIdsByMerchant) {
          for (const sid of sids) slotToMerchant.set(sid, mid);
        }
        for (const ss of slotServices) {
          const svc = priceMap.get(ss.service_id);
          if (!svc) continue;
          const mid = slotToMerchant.get(ss.slot_id);
          if (!mid) continue;
          revenueByMerchant.set(mid, (revenueByMerchant.get(mid) || 0) + svc.price);
        }
      }
    }

    for (const merchant of merchants) {
      results.processed++;
      const count = countByMerchant.get(merchant.id) || 0;
      if (count === 0) { results.skippedEmpty++; continue; }

      const revenue = Math.round(revenueByMerchant.get(merchant.id) || 0);
      const isEN = merchant.locale === 'en';
      const title = isEN ? 'Next week at a glance' : 'Ta semaine à venir';
      const body = revenue > 0
        ? (isEN
          ? `${count} booking${count > 1 ? 's' : ''}, ~€${revenue} expected. Have a great week!`
          : `${count} RDV, ~${revenue}€ prévus. Bonne semaine !`)
        : (isEN
          ? `${count} booking${count > 1 ? 's' : ''} scheduled. Have a great week!`
          : `${count} RDV prévus. Bonne semaine !`);

      const today = todayByMerchant.get(merchant.id)!;
      const sent = await sendMerchantPush({
        supabase,
        merchantId: merchant.id,
        notificationType: 'weekly_recap',
        referenceId: `${merchant.id}-${today}`,
        title,
        body,
        url: '/dashboard/planning',
        tag: 'qarte-merchant-weekly',
      });
      if (sent) results.sent++;
    }

    const elapsedMs = Date.now() - cronStartTime;
    logger.info('Weekly-recap cron completed', { elapsedMs, ...results });
    return NextResponse.json({ success: true, elapsedMs, ...results });
  } catch (error) {
    logger.error('Weekly-recap cron error', { error: String(error) });
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
