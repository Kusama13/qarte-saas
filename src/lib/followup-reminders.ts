import type { SupabaseClient } from '@supabase/supabase-js';
import { computeDepositAmount, computeFollowupDepositDeadline } from './deposit';
import { sendBookingSms } from './sms';
import { sendBookingConfirmationEmail } from './email';
import { buildDepositLinks } from './payment-providers';
import { isPaidStatus } from './subscription-status';
import { isPastDueBlocked } from './merchant-access';
import {
  getTimezoneForCountry,
  getTodayInParis,
  getCurrencyForCountry,
  getAppUrl,
} from './utils';
import type { EmailLocale } from '@/emails/translations';
import logger from './logger';

/**
 * Rappel d'acompte J-7 pour les RDV de suivi (mig 177).
 *
 * Les RDV de suivi (+3/+6 sem.) sont réservés sans acompte immédiat
 * (`deposit_deferred = true`, `deposit_confirmed = false`, `deposit_deadline_at = NULL`).
 * 7 jours avant le RDV, on envoie un email + SMS à la cliente pour régler l'acompte
 * (ou reporter / annuler depuis sa carte), puis on pose `deposit_deadline_at` =
 * RDV − cancel_deadline_days. À partir de là, le cron `deposit-expiration` (existant)
 * libère le créneau si l'acompte n'est pas reçu.
 *
 * FR/BE/CH partagent le même fuseau (CET/CEST) : on calcule la fenêtre des 7 jours
 * sur l'heure de Paris (cohérent avec les autres crons batch).
 *
 * Appelé depuis le cron quotidien `morning-jobs`.
 */
type DeferredSlot = {
  id: string;
  merchant_id: string;
  slot_date: string;
  start_time: string;
  client_name: string | null;
  client_phone: string | null;
  customer_email: string | null;
  total_price: number | null;
  total_duration_minutes: number | null;
  custom_service_name: string | null;
  custom_service_duration: number | null;
  custom_service_price: number | null;
  planning_slot_services?: { service_id: string }[] | null;
};

type MerchantMeta = {
  id: string;
  shop_name: string;
  locale: string | null;
  country: string | null;
  deposit_link: string | null;
  deposit_link_label: string | null;
  deposit_link_2: string | null;
  deposit_link_2_label: string | null;
  deposit_percent: number | null;
  deposit_amount: number | null;
  cancel_deadline_days: number | null;
  reschedule_deadline_days: number | null;
  allow_customer_cancel: boolean | null;
  allow_customer_reschedule: boolean | null;
  subscription_status: string;
  past_due_since: string | null;
};

type ServiceMeta = { id: string; name: string; price: number | null; duration: number | null };

export async function sendFollowupDepositReminders(
  supabase: SupabaseClient,
  opts: { now?: Date; limit?: number } = {},
): Promise<{ processed: number; remindersSent: number; errors: number }> {
  const now = opts.now ?? new Date();
  const limit = opts.limit ?? 200;

  // Fenêtre J-7 : du jour même (rattrapage) jusqu'à aujourd'hui + 7 jours (Paris).
  const today = getTodayInParis();
  const horizon = new Date(`${today}T12:00:00`);
  horizon.setDate(horizon.getDate() + 7);
  const horizonDate = horizon.toISOString().slice(0, 10);

  const { data: slots, error: fetchErr } = await supabase
    .from('merchant_planning_slots')
    .select('id, merchant_id, slot_date, start_time, client_name, client_phone, customer_email, total_price, total_duration_minutes, custom_service_name, custom_service_duration, custom_service_price, planning_slot_services(service_id)')
    .eq('deposit_deferred', true)
    .eq('deposit_confirmed', false)
    .is('deposit_reminder_sent_at', null)
    .is('primary_slot_id', null)
    .not('client_phone', 'is', null)
    .gte('slot_date', today)
    .lte('slot_date', horizonDate)
    .limit(limit);

  if (fetchErr) {
    logger.error('sendFollowupDepositReminders: fetch failed', fetchErr);
    return { processed: 0, remindersSent: 0, errors: 1 };
  }
  if (!slots || slots.length === 0) {
    return { processed: 0, remindersSent: 0, errors: 0 };
  }

  const typedSlots = slots as DeferredSlot[];
  const merchantIds = [...new Set(typedSlots.map(s => s.merchant_id))];
  const allServiceIds = [...new Set(typedSlots.flatMap(s => (s.planning_slot_services || []).map(x => x.service_id)))];

  const [{ data: merchants }, { data: services }] = await Promise.all([
    supabase
      .from('merchants')
      .select('id, shop_name, locale, country, deposit_link, deposit_link_label, deposit_link_2, deposit_link_2_label, deposit_percent, deposit_amount, cancel_deadline_days, reschedule_deadline_days, allow_customer_cancel, allow_customer_reschedule, subscription_status, past_due_since')
      .in('id', merchantIds)
      .is('deleted_at', null),
    allServiceIds.length > 0
      ? supabase.from('merchant_services').select('id, name, price, duration').in('id', allServiceIds)
      : Promise.resolve({ data: [] as ServiceMeta[] }),
  ]);

  const merchantMap = new Map<string, MerchantMeta>((merchants || []).map(m => [m.id, m as MerchantMeta]));
  const serviceMap = new Map<string, ServiceMeta>();
  for (const s of (services || []) as ServiceMeta[]) serviceMap.set(s.id, s);

  let processed = 0;
  let remindersSent = 0;
  let errors = 0;
  const tasks: Promise<unknown>[] = [];

  for (const slot of typedSlots) {
    const merchant = merchantMap.get(slot.merchant_id);
    // Merchant supprimé / suspendu : on ne traite pas (retry au prochain run si réactivé).
    if (!merchant || !isPaidStatus(merchant.subscription_status)) continue;
    if (isPastDueBlocked({ subscription_status: merchant.subscription_status, past_due_since: merchant.past_due_since })) continue;

    try {
      const links = buildDepositLinks(
        merchant.deposit_link,
        merchant.deposit_link_label,
        merchant.deposit_link_2,
        merchant.deposit_link_2_label,
      );
      const nowIso = now.toISOString();

      // Edge : le merchant a retiré son acompte depuis la réservation → plus rien à
      // régler. On dé-différe : le RDV devient une résa confirmée normale (rappels J-1/J-0).
      if (links.length === 0) {
        await supabase
          .from('merchant_planning_slots')
          .update({ deposit_deferred: false, deposit_confirmed: null, deposit_reminder_sent_at: nowIso })
          .eq('id', slot.id);
        processed++;
        continue;
      }

      const serviceIds = (slot.planning_slot_services || []).map(x => x.service_id);
      const serviceDetails = serviceIds
        .map(id => serviceMap.get(id))
        .filter((s): s is ServiceMeta => !!s)
        .map(s => ({ name: s.name, price: Number(s.price || 0), duration: s.duration || 30 }));
      if (slot.custom_service_name) {
        serviceDetails.push({
          name: slot.custom_service_name,
          price: Number(slot.custom_service_price || 0),
          duration: slot.custom_service_duration || 30,
        });
      }
      const totalDuration = slot.total_duration_minutes
        ?? serviceDetails.reduce((sum, s) => sum + s.duration, 0);
      const totalPrice = slot.total_price != null
        ? Number(slot.total_price)
        : serviceDetails.reduce((sum, s) => sum + s.price, 0);

      const depositAmount = computeDepositAmount(
        totalPrice,
        merchant.deposit_amount ? Number(merchant.deposit_amount) : null,
        merchant.deposit_percent ? Number(merchant.deposit_percent) : null,
      );

      const tz = getTimezoneForCountry(merchant.country || 'FR');
      const deadline = computeFollowupDepositDeadline(
        slot.slot_date,
        slot.start_time,
        merchant.cancel_deadline_days ?? 1,
        tz,
        now,
      );

      const locale = (merchant.locale as EmailLocale) || 'fr';
      const currency = getCurrencyForCountry(merchant.country || 'FR') as 'EUR' | 'CHF';

      // Un seul task async par slot, exécutés en parallèle (Promise.allSettled en fin) :
      // on pose d'abord la deadline + le flag dédup (le cron deposit-expiration libère
      // ensuite si non payé), PUIS on envoie email + SMS. Marquer avant l'envoi évite un
      // double rappel si un run suivant repassait avant la fin des envois.
      processed++;
      remindersSent++;
      tasks.push((async () => {
        const { error: updErr } = await supabase
          .from('merchant_planning_slots')
          .update({ deposit_deadline_at: deadline.toISOString(), deposit_reminder_sent_at: nowIso })
          .eq('id', slot.id);
        if (updErr) {
          logger.error(`sendFollowupDepositReminders: update failed for slot ${slot.id}`, updErr);
          return;
        }
        const sends: Promise<unknown>[] = [];
        if (slot.client_phone) {
          sends.push(
            sendBookingSms(supabase, {
              merchantId: merchant.id,
              slotId: slot.id,
              phone: slot.client_phone,
              shopName: merchant.shop_name,
              smsType: 'deposit_reminder',
              locale,
              subscriptionStatus: merchant.subscription_status,
              pastDueSince: merchant.past_due_since,
              date: slot.slot_date,
              time: slot.start_time,
              depositLink: links[0].url,
            }).catch(() => false),
          );
        }
        if (slot.customer_email) {
          sends.push(
            sendBookingConfirmationEmail(slot.customer_email, {
              shopName: merchant.shop_name,
              clientFirstName: slot.client_name || 'Cliente',
              date: slot.slot_date,
              time: slot.start_time,
              services: serviceDetails,
              totalDuration,
              totalPrice,
              currency,
              mode: 'pending_deposit',
              deposit: {
                amount: depositAmount,
                percent: merchant.deposit_percent || null,
                deadlineHours: null, // deadline = RDV − cancel_deadline_days, pas un délai en heures
                links,
              },
              loyaltyCardUrl: `${getAppUrl()}/customer/card/${merchant.id}`,
              cancelPolicyDays: merchant.allow_customer_cancel ? (merchant.cancel_deadline_days ?? 1) : null,
              reschedulePolicyDays: merchant.allow_customer_reschedule ? (merchant.reschedule_deadline_days ?? 1) : null,
              locale,
            }).catch(err => logger.error('Followup deposit reminder email failed:', err)),
          );
        }
        await Promise.allSettled(sends);
      })());
    } catch (err) {
      logger.error(`sendFollowupDepositReminders: unexpected error on slot ${slot.id}`, err);
      errors++;
    }
  }

  if (tasks.length > 0) await Promise.allSettled(tasks);

  return { processed, remindersSent, errors };
}
