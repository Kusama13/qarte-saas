import { SupabaseClient } from '@supabase/supabase-js';
import { sendSms } from './ovh-sms';
import { notifyMerchantQuotaAlert } from './sms-alerts';
import { getPlanFeatures } from './plan-tiers';
import type { PlanTier, SubscriptionStatus } from '@/types';

export { SMS_FREE_QUOTA, SMS_OVERAGE_COST, SMS_UNIT_COST, SMS_UNIT_COST_CENTS } from './sms-constants';
import { SMS_FREE_QUOTA, SMS_OVERAGE_COST } from './sms-constants';

/** Quota mensuel selon tier merchant (0 Fidélité / 100 Tout-en-un, 100 pour trials). */
export function getQuotaFor(merchant: { subscription_status?: string | null; plan_tier?: string | null } | null): number {
  return getPlanFeatures(merchant as { subscription_status: SubscriptionStatus; plan_tier?: PlanTier } | null).smsQuota;
}

/** SMS types envoyés gratuitement aux merchants Fidélité (pas de quota, pas de pack consommé).
 *  Le coût OVH est absorbé par Qarte — usage attendu marginal (anniversaires + récompenses parrainage). */
const FIDELITY_FREE_SMS_TYPES: SmsType[] = ['birthday', 'referral_reward'];

function isFidelityFreeSms(merchant: { plan_tier?: string | null } | null, smsType: SmsType): boolean {
  return merchant?.plan_tier === 'fidelity' && FIDELITY_FREE_SMS_TYPES.includes(smsType);
}

export const PAID_STATUSES = ['active', 'canceling', 'past_due'] as const;

// ── Templates SMS (< 160 chars, vouvoiement client-facing) ──

export type SmsType = 'reminder_j1' | 'reminder_j0' | 'confirmation_no_deposit' | 'confirmation_deposit' | 'birthday' | 'referral_reward' | 'booking_moved' | 'booking_cancelled';

export type MarketingSmsType = 'campaign' | 'welcome' | 'review_request' | 'voucher_expiry' | 'referral_invite' | 'inactive_reminder' | 'near_reward';

const SMS_TEMPLATES: Record<string, Record<SmsType, (...args: string[]) => string>> = {
  fr: {
    reminder_j1: (shop, time) => `Rappel : RDV demain à ${time} chez ${shop}. Cumulez vos points fidélité lors de votre passage !`,
    reminder_j0: (shop, time) => `Rappel : RDV aujourd'hui à ${time} chez ${shop}. À tout à l'heure !`,
    confirmation_no_deposit: (shop, date, time) => `RDV confirmé chez ${shop} le ${date} à ${time}. Cumulez vos points fidélité lors de votre passage !`,
    confirmation_deposit: (shop, date, time) => `Acompte validé ! RDV chez ${shop} le ${date} à ${time}. À bientôt !`,
    birthday: (shop, gift, name) => name ? `${name}, joyeux anniversaire ! ${shop} vous offre : ${gift}. Rendez-vous vite pour en profiter !` : `Joyeux anniversaire ! ${shop} vous offre : ${gift}. Rendez-vous vite pour en profiter !`,
    referral_reward: (shop, reward) => `Bonne nouvelle ! Votre filleul(e) a utilisé sa récompense. Votre cadeau vous attend chez ${shop} : ${reward}`,
    booking_moved: (shop, date, time) => `Votre RDV chez ${shop} a été déplacé au ${date} à ${time}. À bientôt !`,
    booking_cancelled: (shop, date, time) => `Votre RDV chez ${shop} le ${date} à ${time} a été annulé. Contactez-nous pour reprogrammer.`,
  },
  en: {
    reminder_j1: (shop, time) => `Reminder: appointment tomorrow at ${time} at ${shop}. Earn loyalty points on your visit!`,
    reminder_j0: (shop, time) => `Reminder: appointment today at ${time} at ${shop}. See you soon!`,
    confirmation_no_deposit: (shop, date, time) => `Booking confirmed at ${shop} on ${date} at ${time}. Earn loyalty points on your visit!`,
    confirmation_deposit: (shop, date, time) => `Deposit confirmed! Appointment at ${shop} on ${date} at ${time}. See you soon!`,
    birthday: (shop, gift, name) => name ? `${name}, happy birthday! ${shop} offers you: ${gift}. Visit us to claim it!` : `Happy birthday! ${shop} offers you: ${gift}. Visit us to claim it!`,
    referral_reward: (shop, reward) => `Great news! Your referral used their reward. Your gift is waiting at ${shop}: ${reward}`,
    booking_moved: (shop, date, time) => `Your appointment at ${shop} has been moved to ${date} at ${time}. See you soon!`,
    booking_cancelled: (shop, date, time) => `Your appointment at ${shop} on ${date} at ${time} has been cancelled. Contact us to reschedule.`,
  },
};

// ── Global SMS config (admin toggles) ──

export interface GlobalSmsConfig {
  reminder_enabled: boolean;
  confirmation_enabled: boolean;
  birthday_enabled: boolean;
  referral_enabled: boolean;
}

export async function getGlobalSmsConfig(supabase: SupabaseClient): Promise<GlobalSmsConfig> {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'sms_global')
    .maybeSingle();

  if (!data?.value) return { reminder_enabled: true, confirmation_enabled: true, birthday_enabled: true, referral_enabled: true };
  const val = data.value as GlobalSmsConfig;
  return {
    reminder_enabled: val.reminder_enabled !== false,
    confirmation_enabled: val.confirmation_enabled !== false,
    birthday_enabled: val.birthday_enabled !== false,
    referral_enabled: val.referral_enabled !== false,
  };
}

// Map SMS type to its global toggle key.
// confirmation_* / booking_moved / booking_cancelled are merchant opt-in (toggle in UI) — always allowed here.
function isTypeEnabled(smsType: SmsType, config: GlobalSmsConfig): boolean {
  switch (smsType) {
    case 'reminder_j1':
    case 'reminder_j0': return config.reminder_enabled;
    case 'confirmation_no_deposit':
    case 'confirmation_deposit':
    case 'booking_moved':
    case 'booking_cancelled': return true;
    case 'birthday': return config.birthday_enabled;
    case 'referral_reward': return config.referral_enabled;
  }
}

// ── SMS usage / quota ──

export interface SmsUsage {
  sent: number;
  remaining: number;
  overageCount: number;
  overageCost: number;
  periodStart: string;
}

export interface SmsQuotaStatus {
  sent: number;
  remaining: number;
  packBalance: number;
  totalAvailable: number;
  blocked: boolean;
  periodStart: string;
}

/**
 * Check whether a merchant can still send an SMS this cycle.
 * Reads the billing-period count + sms_pack_balance. Does not mutate.
 */
export async function getSmsQuotaStatus(
  supabase: SupabaseClient,
  merchantId: string,
  billingPeriodStart?: string | null,
  packBalance?: number,
  freeQuota?: number,
): Promise<SmsQuotaStatus> {
  let balance = packBalance;
  let quota = freeQuota;
  if (balance == null || quota == null) {
    const { data } = await supabase
      .from('merchants')
      .select('sms_pack_balance, plan_tier, subscription_status')
      .eq('id', merchantId)
      .maybeSingle();
    const row = data as { sms_pack_balance?: number; plan_tier?: string; subscription_status?: string } | null;
    if (balance == null) balance = Number(row?.sms_pack_balance || 0);
    if (quota == null) quota = getQuotaFor(row);
  }
  const usage = await getSmsUsageThisMonth(supabase, merchantId, billingPeriodStart, quota);
  const totalAvailable = Math.max(0, quota - usage.sent) + balance;
  return {
    sent: usage.sent,
    remaining: usage.remaining,
    packBalance: balance,
    totalAvailable,
    blocked: totalAvailable === 0,
    periodStart: usage.periodStart,
  };
}

/**
 * Atomically decrement the merchant's pack balance by 1. Returns true on success.
 * Uses a conditional update to avoid race conditions (only succeeds if balance > 0).
 */
async function refundPackOne(supabase: SupabaseClient, merchantId: string): Promise<void> {
  // Atomic via RPC (évite la race read-then-write avec consumePackOne concurrent).
  await supabase.rpc('credit_sms_pack', { p_merchant_id: merchantId, p_amount: 1 });
}

async function consumePackOne(supabase: SupabaseClient, merchantId: string): Promise<boolean> {
  const { data } = await supabase
    .from('merchants')
    .select('sms_pack_balance')
    .eq('id', merchantId)
    .maybeSingle();
  const balance = Number((data as { sms_pack_balance?: number } | null)?.sms_pack_balance || 0);
  if (balance <= 0) return false;

  const { data: updated } = await supabase
    .from('merchants')
    .update({ sms_pack_balance: balance - 1 })
    .eq('id', merchantId)
    .eq('sms_pack_balance', balance)
    .select('id')
    .maybeSingle();
  return !!updated;
}

export async function getSmsUsageThisMonth(supabase: SupabaseClient, merchantId: string, billingPeriodStart?: string | null, freeQuota: number = SMS_FREE_QUOTA): Promise<SmsUsage> {
  // Compute current billing cycle start from the subscription day-of-month
  // e.g. subscribed on Feb 27 → cycles: Feb 27, Mar 27, Apr 27...
  // On Apr 6, current cycle started Mar 27. On Apr 28, current cycle started Apr 27.
  let periodStart: string;
  if (billingPeriodStart) {
    const subDay = new Date(billingPeriodStart).getUTCDate();
    const now = new Date();
    const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), subDay));
    // If we haven't reached the billing day yet this month, cycle started last month
    periodStart = (now < thisMonth)
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, subDay)).toISOString()
      : thisMonth.toISOString();
  } else {
    periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  }

  const { count } = await supabase
    .from('sms_logs')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .gte('created_at', periodStart)
    .neq('status', 'failed');

  const sent = count || 0;
  const overageCount = Math.max(0, sent - freeQuota);
  return {
    sent,
    remaining: Math.max(0, freeQuota - sent),
    overageCount,
    overageCost: parseFloat((overageCount * SMS_OVERAGE_COST).toFixed(2)),
    periodStart,
  };
}

// ── Main send function ──

interface SendSmsParams {
  merchantId: string;
  slotId?: string | null;
  phone: string;
  shopName: string;
  smsType: SmsType;
  locale: string;
  subscriptionStatus: string;
  // For booking types
  date?: string;
  time?: string;
  // For birthday
  gift?: string;
  clientName?: string;
  // For referral
  reward?: string;
  // Pass pre-fetched config to avoid re-querying in loops
  globalConfig?: GlobalSmsConfig;
}

/**
 * Send a transactional SMS to a client. Fire-and-forget — never throws.
 * Checks global toggle, subscription status, and dedup before sending.
 */
export async function sendBookingSms(supabase: SupabaseClient, params: SendSmsParams): Promise<boolean> {
  const { merchantId, slotId, phone, shopName, smsType, locale, subscriptionStatus, date, time, gift, clientName, reward, globalConfig: preloadedConfig } = params;

  if (!phone) return false;

  try {
    if (!(PAID_STATUSES as readonly string[]).includes(subscriptionStatus)) {
      return false;
    }

    const globalConfig = preloadedConfig || await getGlobalSmsConfig(supabase);
    if (!isTypeEnabled(smsType, globalConfig)) return false;

    // 3. Dedup — check if SMS already sent for this merchant + type + slot/phone
    if (slotId) {
      const { data: existing } = await supabase
        .from('sms_logs')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('sms_type', smsType)
        .eq('slot_id', slotId)
        .maybeSingle();
      if (existing) return false;
    } else {
      // Non-slot types (birthday, referral_reward): dedup by phone + type + today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from('sms_logs')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('sms_type', smsType)
        .eq('phone_to', phone)
        .gte('created_at', todayStart.toISOString())
        .maybeSingle();
      if (existing) return false;
    }

    // 4. Build message from template
    const lang = locale === 'en' ? 'en' : 'fr';
    const template = SMS_TEMPLATES[lang][smsType];
    // Format date: "2026-04-08" → "08/04/2026" (FR) or "04/08/2026" (EN)
    const fmtDate = date ? (lang === 'fr'
      ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
      : `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`) : '';
    let message: string;
    switch (smsType) {
      case 'reminder_j1':
      case 'reminder_j0':
        message = template(shopName, time || '');
        break;
      case 'confirmation_no_deposit':
      case 'confirmation_deposit':
      case 'booking_moved':
      case 'booking_cancelled':
        message = template(shopName, fmtDate, time || '');
        break;
      case 'birthday':
        message = template(shopName, gift || '', clientName || '');
        break;
      case 'referral_reward':
        message = template(shopName, reward || '');
        break;
    }

    // 5. Gate: enforce quota selon tier + pack. No overage — block if both exhausted.
    // Fidélité bypass : birthday + referral_reward envoyés sans quota ni pack (coût absorbé).
    const { data: merchantRow } = await supabase
      .from('merchants')
      .select('billing_period_start, sms_pack_balance, plan_tier, subscription_status')
      .eq('id', merchantId)
      .maybeSingle();
    const mRow = merchantRow as { billing_period_start?: string | null; sms_pack_balance?: number; plan_tier?: string; subscription_status?: string } | null;
    const bps = mRow?.billing_period_start || null;
    const packBalance = Number(mRow?.sms_pack_balance || 0);
    const fidelityFree = isFidelityFreeSms(mRow, smsType);

    let consumedFromPack = false;

    if (!fidelityFree) {
      const freeQuota = getQuotaFor(mRow);
      const usage = await getSmsUsageThisMonth(supabase, merchantId, bps, freeQuota);
      const quotaLeft = Math.max(0, freeQuota - usage.sent);

      // Alerts at 80% / 100% thresholds (fire-and-forget, deduped per cycle)
      const alert80 = Math.floor(freeQuota * 0.8);
      const cycleStart = usage.periodStart.slice(0, 10);
      if (usage.sent + 1 >= alert80 && usage.sent + 1 < freeQuota) {
        void notifyMerchantQuotaAlert(supabase, merchantId, '80', cycleStart);
      } else if (usage.sent + 1 >= freeQuota) {
        void notifyMerchantQuotaAlert(supabase, merchantId, '100', cycleStart);
      }

      if (quotaLeft === 0 && packBalance === 0) {
        return false; // blocked — merchant must buy a pack
      }

      if (quotaLeft === 0) {
        const ok = await consumePackOne(supabase, merchantId);
        if (!ok) return false; // race: pack emptied concurrently
        consumedFromPack = true;
      }
    }

    // 6. Insert log FIRST (prevents concurrent duplicate sends via unique constraint)
    // Cost = 0 (free quota or pre-paid pack). No overage anymore.
    const { data: logRow, error: logError } = await supabase.from('sms_logs').insert({
      merchant_id: merchantId,
      slot_id: slotId || null,
      phone_to: phone,
      sms_type: smsType,
      message_body: message,
      status: 'sent',
      cost_euro: 0,
    }).select('id').maybeSingle();

    // Unique constraint violation = already sent (concurrent dedup) → refund the pack consumption
    if (logError && consumedFromPack) {
      await refundPackOne(supabase, merchantId);
    }

    // Unique constraint violation = already sent (concurrent dedup)
    if (logError) return false;

    // 7. Send via OVH
    const result = await sendSms(phone, message);

    // 8. Update log with result. Refund pack if send failed.
    if (logRow?.id) {
      await supabase.from('sms_logs').update({
        ovh_job_id: result.jobId || null,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        cost_euro: 0,
      }).eq('id', logRow.id);
    }
    if (!result.success && consumedFromPack) {
      await refundPackOne(supabase, merchantId);
    }

    return result.success;
  } catch (err) {
    console.error(`[sms] Error sending ${smsType} to ${phone}:`, err);
    return false;
  }
}

// ── Marketing campaign sender ──
// Used by the dispatch cron. Respects the same quota→pack→block chain.

export interface SendMarketingSmsParams {
  merchantId: string;
  phone: string;
  body: string;
  billingPeriodStart?: string | null;
  smsType?: MarketingSmsType;
}

export interface SendMarketingSmsResult {
  success: boolean;
  blocked?: boolean;
  error?: string;
}

export async function sendMarketingSms(
  supabase: SupabaseClient,
  params: SendMarketingSmsParams,
): Promise<SendMarketingSmsResult> {
  const { merchantId, phone, body, billingPeriodStart, smsType = 'campaign' } = params;
  if (!phone || !body) return { success: false, error: 'invalid_input' };

  try {
    // 1. Gate: paid subscription + quota selon tier + pack
    const { data: merchant } = await supabase
      .from('merchants')
      .select('billing_period_start, sms_pack_balance, subscription_status, plan_tier')
      .eq('id', merchantId)
      .maybeSingle();
    const merchantRow = merchant as { billing_period_start?: string | null; sms_pack_balance?: number; subscription_status?: string; plan_tier?: string } | null;
    if (!merchantRow || !(PAID_STATUSES as readonly string[]).includes(merchantRow.subscription_status || '')) {
      return { success: false, error: 'subscription_inactive' };
    }
    const bps = billingPeriodStart !== undefined ? billingPeriodStart : (merchantRow.billing_period_start || null);
    const packBalance = Number(merchantRow.sms_pack_balance || 0);
    const freeQuota = getQuotaFor(merchantRow);
    const usage = await getSmsUsageThisMonth(supabase, merchantId, bps, freeQuota);
    const quotaLeft = Math.max(0, freeQuota - usage.sent);

    const alert80 = Math.floor(freeQuota * 0.8);
    const cycleStart = usage.periodStart.slice(0, 10);
    if (usage.sent + 1 >= alert80 && usage.sent + 1 < freeQuota) {
      void notifyMerchantQuotaAlert(supabase, merchantId, '80', cycleStart);
    } else if (usage.sent + 1 >= freeQuota) {
      void notifyMerchantQuotaAlert(supabase, merchantId, '100', cycleStart);
    }

    if (quotaLeft === 0 && packBalance === 0) {
      return { success: false, blocked: true, error: 'quota_exhausted' };
    }

    let consumedFromPack = false;
    if (quotaLeft === 0) {
      const ok = await consumePackOne(supabase, merchantId);
      if (!ok) return { success: false, blocked: true, error: 'pack_race' };
      consumedFromPack = true;
    }

    // 2. Insert log (refund pack si échec d'insertion pour préserver la cohérence)
    const { data: logRow, error: logError } = await supabase.from('sms_logs').insert({
      merchant_id: merchantId,
      slot_id: null,
      phone_to: phone,
      sms_type: smsType,
      message_body: body,
      status: 'sent',
      cost_euro: 0,
    }).select('id').maybeSingle();
    if (logError) {
      if (consumedFromPack) await refundPackOne(supabase, merchantId);
      return { success: false, error: 'log_insert_failed' };
    }

    // 3. Send via OVH
    const result = await sendSms(phone, body);

    // 4. Update log + refund pack on failure
    if (logRow?.id) {
      await supabase.from('sms_logs').update({
        ovh_job_id: result.jobId || null,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
      }).eq('id', logRow.id);
    }
    if (!result.success && consumedFromPack) {
      await refundPackOne(supabase, merchantId);
    }

    return { success: result.success, error: result.error };
  } catch (err) {
    console.error(`[sms] Marketing error to ${phone}:`, err);
    return { success: false, error: 'exception' };
  }
}
