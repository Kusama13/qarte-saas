import type { SupabaseClient } from '@supabase/supabase-js';
import { sendMerchantPush } from './merchant-push';
import { sendSlotReleasedEmail } from './email';
import { computeDepositAmount } from './deposit';
import { batchGetUserEmails } from './cron-helpers';
import logger from './logger';

type ExpiredSlot = {
  id: string;
  merchant_id: string;
  client_name: string | null;
  client_phone: string | null;
  customer_id: string | null;
  slot_date: string;
  start_time: string;
  total_duration_minutes: number | null;
  notes: string | null;
  deposit_deadline_at: string | null;
  custom_service_name: string | null;
  custom_service_duration: number | null;
  custom_service_price: number | null;
  custom_service_color: string | null;
  planning_slot_services?: { service_id: string }[] | null;
};

type MerchantMeta = {
  id: string;
  user_id: string;
  shop_name: string;
  locale: string | null;
  booking_mode: string | null;
  deposit_percent: number | null;
  deposit_amount: number | null;
};

type ServicePrice = { id: string; price: number | null; merchant_id: string };

const WIPE_FIELDS = {
  client_name: null,
  client_phone: null,
  customer_id: null,
  deposit_confirmed: null,
  deposit_deadline_at: null,
  custom_service_name: null,
  custom_service_duration: null,
  custom_service_price: null,
  custom_service_color: null,
};

/**
 * Snapshot expired deposit reservations into `booking_deposit_failures`, then wipe the slot
 * so it becomes available for new bookings. Sends merchant push + email per release.
 *
 * Called from the hourly `/api/cron/deposit-expiration` cron — single source of truth for
 * deposit-triggered slot releases.
 */
export async function releaseExpiredDeposits(
  supabase: SupabaseClient,
  opts: { limit?: number; sendEmails?: boolean } = {},
): Promise<{ archived: number; released: number; errors: number }> {
  const { limit = 200, sendEmails = true } = opts;
  const nowIso = new Date().toISOString();

  const { data: expiredSlots, error: fetchErr } = await supabase
    .from('merchant_planning_slots')
    .select('id, merchant_id, client_name, client_phone, customer_id, slot_date, start_time, total_duration_minutes, notes, deposit_deadline_at, custom_service_name, custom_service_duration, custom_service_price, custom_service_color, planning_slot_services(service_id)')
    .eq('deposit_confirmed', false)
    .not('deposit_deadline_at', 'is', null)
    .lt('deposit_deadline_at', nowIso)
    .is('primary_slot_id', null)
    .limit(limit);

  if (fetchErr) {
    logger.error('releaseExpiredDeposits: fetch failed', fetchErr);
    return { archived: 0, released: 0, errors: 1 };
  }

  if (!expiredSlots || expiredSlots.length === 0) {
    return { archived: 0, released: 0, errors: 0 };
  }

  const typedSlots = expiredSlots as ExpiredSlot[];
  const slotIds = typedSlots.map(s => s.id);
  const merchantIds = [...new Set(typedSlots.map(s => s.merchant_id))];
  const allServiceIds = [...new Set(typedSlots.flatMap(s => (s.planning_slot_services || []).map(x => x.service_id)))];

  const [
    { data: merchants },
    { data: services },
    { data: allFillerSlots },
  ] = await Promise.all([
    supabase.from('merchants').select('id, user_id, shop_name, locale, booking_mode, deposit_percent, deposit_amount').in('id', merchantIds),
    allServiceIds.length > 0
      ? supabase.from('merchant_services').select('id, price, merchant_id').in('id', allServiceIds)
      : Promise.resolve({ data: [] as ServicePrice[] }),
    supabase.from('merchant_planning_slots').select('id, primary_slot_id').in('primary_slot_id', slotIds),
  ]);

  const merchantMap = new Map<string, MerchantMeta>((merchants || []).map(m => [m.id, m as MerchantMeta]));
  const serviceMap = new Map<string, ServicePrice>();
  for (const s of (services || []) as ServicePrice[]) serviceMap.set(s.id, s);
  const fillersByPrimary = new Map<string, string[]>();
  for (const f of (allFillerSlots || []) as { id: string; primary_slot_id: string }[]) {
    const arr = fillersByPrimary.get(f.primary_slot_id) ?? [];
    arr.push(f.id);
    fillersByPrimary.set(f.primary_slot_id, arr);
  }

  const userIds = [...new Set([...merchantMap.values()].map(m => m.user_id).filter(Boolean))];
  const emailMap = sendEmails && userIds.length > 0
    ? await batchGetUserEmails(supabase, userIds)
    : new Map<string, string>();

  let archived = 0;
  let released = 0;
  let errors = 0;
  const notifications: Promise<unknown>[] = [];

  for (const slot of typedSlots) {
    try {
      const merchant = merchantMap.get(slot.merchant_id);
      const serviceIds = (slot.planning_slot_services || []).map(x => x.service_id);
      const catalogPrice = serviceIds.reduce((sum, id) => sum + Number(serviceMap.get(id)?.price || 0), 0);
      const totalPrice = catalogPrice + Number(slot.custom_service_price || 0);
      const depositAmount = merchant
        ? computeDepositAmount(totalPrice, merchant.deposit_amount, merchant.deposit_percent)
        : null;

      const { error: archiveErr } = await supabase
        .from('booking_deposit_failures')
        .insert({
          merchant_id: slot.merchant_id,
          customer_id: slot.customer_id,
          client_name: slot.client_name || 'Cliente',
          client_phone: slot.client_phone,
          service_ids: serviceIds,
          custom_service_name: slot.custom_service_name,
          custom_service_duration: slot.custom_service_duration,
          custom_service_price: slot.custom_service_price,
          custom_service_color: slot.custom_service_color,
          original_slot_date: slot.slot_date,
          original_start_time: slot.start_time,
          total_duration_minutes: slot.total_duration_minutes,
          notes: slot.notes,
          deposit_amount: depositAmount,
          expired_at: slot.deposit_deadline_at || nowIso,
        });

      if (archiveErr) {
        logger.error(`releaseExpiredDeposits: archive failed for slot ${slot.id}`, archiveErr);
        errors++;
        continue;
      }
      archived++;

      const fillerIds = fillersByPrimary.get(slot.id) ?? [];
      const allSlotIds = [slot.id, ...fillerIds];

      const [svcDelete, fillerWipe] = await Promise.all([
        supabase.from('planning_slot_services').delete().in('slot_id', allSlotIds),
        fillerIds.length > 0
          ? supabase.from('merchant_planning_slots')
              .update({ ...WIPE_FIELDS, primary_slot_id: null })
              .in('id', fillerIds)
          : Promise.resolve({ error: null }),
      ]);

      if (svcDelete.error || fillerWipe.error) {
        logger.error(`releaseExpiredDeposits: partial wipe failure for slot ${slot.id}`, { svc: svcDelete.error, filler: fillerWipe.error });
      }

      const isFreeMode = merchant?.booking_mode === 'free';
      if (isFreeMode) {
        await supabase.from('merchant_planning_slots').delete().eq('id', slot.id);
      } else {
        await supabase.from('merchant_planning_slots').update(WIPE_FIELDS).eq('id', slot.id);
      }

      released++;

      if (merchant) {
        const isEN = merchant.locale === 'en';
        notifications.push(sendMerchantPush({
          supabase,
          merchantId: slot.merchant_id,
          notificationType: 'deposit_expired',
          referenceId: slot.id,
          title: isEN ? 'Slot released — deposit not received' : 'Créneau libéré — acompte non reçu',
          body: isEN
            ? `${slot.client_name} — ${slot.slot_date} at ${slot.start_time}`
            : `${slot.client_name} — ${slot.slot_date} à ${slot.start_time}`,
          url: `/dashboard/planning?tab=reservations`,
          tag: 'qarte-merchant-deposit',
        }));

        if (sendEmails && slot.client_name) {
          const email = emailMap.get(merchant.user_id);
          if (email) {
            notifications.push(sendSlotReleasedEmail(email, {
              shopName: merchant.shop_name,
              clientName: slot.client_name,
              date: slot.slot_date,
              time: slot.start_time,
              locale: (merchant.locale || 'fr') as 'fr' | 'en',
            }).catch(() => {}));
          }
        }
      }
    } catch (err) {
      logger.error(`releaseExpiredDeposits: unexpected error on slot ${slot.id}`, err);
      errors++;
    }
  }

  if (notifications.length > 0) await Promise.allSettled(notifications);

  return { archived, released, errors };
}
