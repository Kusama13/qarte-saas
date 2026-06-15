// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendBookingConfirmationEmail } from './email';
import { computeDepositAmount } from './deposit';
import { buildDepositLinks } from './payment-providers';
import { getAppUrl, getCurrencyForCountry } from './utils';
import type { EmailLocale } from '@/emails/translations';
import logger from './logger';

// Refetch slot+merchant+services+customer en parallèle pour reconstruire les params
// nécessaires à BookingConfirmationEmail mode='deposit_received'. Les routes d'API qui
// PATCHent deposit_confirmed n'ont pas ce contexte en mémoire.
//
// Race connue (acceptable) : 2 PATCHes concurrents avec deposit_confirmed=true peuvent
// faire double-fire l'email. Le bouton merchant a `disabled={busy}` côté UI ce qui
// l'évite en pratique. Si on veut garantir l'unicité, ajouter une colonne
// `deposit_confirmed_email_sent_at` et la check ici.
export async function sendDepositReceivedEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: SupabaseClient<any>,
  merchantId: string,
  slotId: string,
  customerEmail: string,
): Promise<void> {
  // Pré-fetch slot juste pour récupérer customer_id (nécessaire au customer fetch parallèle).
  // Petit coût additionnel mais permet la parallélisation des 3 fetchs principaux.
  const { data: slotPre } = await supabaseAdmin
    .from('merchant_planning_slots')
    .select('customer_id')
    .eq('id', slotId)
    .single();

  const [{ data: slot }, { data: merchant }, { data: customer }] = await Promise.all([
    supabaseAdmin
      .from('merchant_planning_slots')
      .select('slot_date, start_time, total_duration_minutes, customer_address, total_price, planning_slot_services(service:merchant_services!service_id(name, price, duration))')
      .eq('id', slotId)
      .single(),
    supabaseAdmin
      .from('merchants')
      .select('id, shop_name, locale, country, deposit_link, deposit_link_label, deposit_link_2, deposit_link_2_label, deposit_percent, deposit_amount, deposit_deadline_hours, allow_customer_cancel, cancel_deadline_days, allow_customer_reschedule, reschedule_deadline_days')
      .eq('id', merchantId)
      .single(),
    slotPre?.customer_id
      ? supabaseAdmin.from('customers').select('first_name').eq('id', slotPre.customer_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!slot || !merchant) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services = (slot.planning_slot_services || []).map((row: any) => row.service).filter(Boolean).map((s: any) => ({
    name: s.name as string,
    price: Number(s.price || 0),
    duration: Number(s.duration || 30),
  }));

  if (services.length === 0) {
    logger.warn('Deposit received email skipped: slot has no services', { slotId, merchantId });
    return;
  }

  // Prix réduit snapshot (mig 176) ; fallback somme brute pour les résas legacy (total_price NULL).
  const rawTotal = services.reduce((sum: number, s: { price: number }) => sum + s.price, 0);
  const totalPrice = slot.total_price != null ? Number(slot.total_price) : rawTotal;
  const totalDuration = slot.total_duration_minutes || services.reduce((sum: number, s: { duration: number }) => sum + s.duration, 0);
  const depositAmount = computeDepositAmount(
    totalPrice,
    merchant.deposit_amount ? Number(merchant.deposit_amount) : null,
    merchant.deposit_percent ? Number(merchant.deposit_percent) : null,
  );
  const links = buildDepositLinks(
    merchant.deposit_link,
    merchant.deposit_link_label,
    merchant.deposit_link_2,
    merchant.deposit_link_2_label,
  );
  const currency = getCurrencyForCountry(merchant.country) as 'EUR' | 'CHF';

  await sendBookingConfirmationEmail(customerEmail, {
    shopName: merchant.shop_name,
    clientFirstName: customer?.first_name || '',
    date: slot.slot_date,
    time: slot.start_time,
    services,
    totalDuration,
    totalPrice,
    currency,
    customerAddress: slot.customer_address,
    mode: 'deposit_received',
    deposit: depositAmount != null ? {
      amount: depositAmount,
      percent: merchant.deposit_percent || null,
      deadlineHours: merchant.deposit_deadline_hours || null,
      links,
    } : null,
    loyaltyCardUrl: `${getAppUrl()}/customer/card/${merchant.id}`,
    cancelPolicyDays: merchant.allow_customer_cancel ? (merchant.cancel_deadline_days ?? 1) : null,
    reschedulePolicyDays: merchant.allow_customer_reschedule ? (merchant.reschedule_deadline_days ?? 1) : null,
    locale: (merchant.locale as EmailLocale) || 'fr',
  });
}
