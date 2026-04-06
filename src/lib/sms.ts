import { SupabaseClient } from '@supabase/supabase-js';
import { sendSms } from './ovh-sms';

export const SMS_FREE_QUOTA = 100;
export const SMS_OVERAGE_COST = 0.075;

const PAID_STATUSES = ['active', 'canceling', 'past_due'];

// ── Templates SMS (< 160 chars, vouvoiement client-facing) ──

export type SmsType = 'reminder_j1' | 'confirmation_no_deposit' | 'confirmation_deposit' | 'birthday' | 'referral_reward' | 'booking_moved';

const SMS_TEMPLATES: Record<string, Record<SmsType, (...args: string[]) => string>> = {
  fr: {
    reminder_j1: (shop, time) => `Rappel : RDV demain à ${time} chez ${shop}. Cumulez vos points fidélité lors de votre passage !`,
    confirmation_no_deposit: (shop, date, time) => `RDV confirmé chez ${shop} le ${date} à ${time}. Cumulez vos points fidélité lors de votre passage !`,
    confirmation_deposit: (shop, date, time) => `Acompte validé ! RDV chez ${shop} le ${date} à ${time}. À bientôt !`,
    birthday: (shop, gift) => `Joyeux anniversaire ! ${shop} vous offre : ${gift}. Rendez-vous vite pour en profiter !`,
    referral_reward: (shop, reward) => `Bonne nouvelle ! Votre filleul(e) a utilisé sa récompense. Votre cadeau vous attend chez ${shop} : ${reward}`,
    booking_moved: (shop, date, time) => `Votre RDV chez ${shop} a été déplacé au ${date} à ${time}. À bientôt !`,
  },
  en: {
    reminder_j1: (shop, time) => `Reminder: appointment tomorrow at ${time} at ${shop}. Earn loyalty points on your visit!`,
    confirmation_no_deposit: (shop, date, time) => `Booking confirmed at ${shop} on ${date} at ${time}. Earn loyalty points on your visit!`,
    confirmation_deposit: (shop, date, time) => `Deposit confirmed! Appointment at ${shop} on ${date} at ${time}. See you soon!`,
    birthday: (shop, gift) => `Happy birthday! ${shop} offers you: ${gift}. Visit us to claim it!`,
    referral_reward: (shop, reward) => `Great news! Your referral used their reward. Your gift is waiting at ${shop}: ${reward}`,
    booking_moved: (shop, date, time) => `Your appointment at ${shop} has been moved to ${date} at ${time}. See you soon!`,
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

// Map SMS type to its global toggle key
function isTypeEnabled(smsType: SmsType, config: GlobalSmsConfig): boolean {
  switch (smsType) {
    case 'reminder_j1': return config.reminder_enabled;
    case 'confirmation_no_deposit':
    case 'confirmation_deposit':
    case 'booking_moved': return config.confirmation_enabled;
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
}

export async function getSmsUsageThisMonth(supabase: SupabaseClient, merchantId: string): Promise<SmsUsage> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from('sms_logs')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .gte('created_at', firstOfMonth)
    .neq('status', 'failed');

  const sent = count || 0;
  const overageCount = Math.max(0, sent - SMS_FREE_QUOTA);
  return {
    sent,
    remaining: Math.max(0, SMS_FREE_QUOTA - sent),
    overageCount,
    overageCost: parseFloat((overageCount * SMS_OVERAGE_COST).toFixed(2)),
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
  const { merchantId, slotId, phone, shopName, smsType, locale, subscriptionStatus, date, time, gift, reward, globalConfig: preloadedConfig } = params;

  if (!phone) return false;

  try {
    if (!PAID_STATUSES.includes(subscriptionStatus)) {
      return false;
    }

    const globalConfig = preloadedConfig || await getGlobalSmsConfig(supabase);
    if (!isTypeEnabled(smsType, globalConfig)) return false;

    // 3. Dedup — check if SMS already sent for this merchant + type + slot (only for slot-based types)
    if (slotId) {
      const { data: existing } = await supabase
        .from('sms_logs')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('sms_type', smsType)
        .eq('slot_id', slotId)
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
        message = template(shopName, time || '');
        break;
      case 'confirmation_no_deposit':
      case 'confirmation_deposit':
      case 'booking_moved':
        message = template(shopName, fmtDate, time || '');
        break;
      case 'birthday':
        message = template(shopName, gift || '');
        break;
      case 'referral_reward':
        message = template(shopName, reward || '');
        break;
    }

    // 5. Compute cost (free if under quota, 0.075€ if over)
    const usage = await getSmsUsageThisMonth(supabase, merchantId);
    const cost = usage.sent >= SMS_FREE_QUOTA ? SMS_OVERAGE_COST : 0;

    // 6. Send via OVH
    const result = await sendSms(phone, message);

    // 7. Log
    await supabase.from('sms_logs').insert({
      merchant_id: merchantId,
      slot_id: slotId || null,
      phone_to: phone,
      sms_type: smsType,
      message_body: message,
      ovh_job_id: result.jobId || null,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      cost_euro: result.success ? cost : 0,
    });

    return result.success;
  } catch (err) {
    console.error(`[sms] Error sending ${smsType} to ${phone}:`, err);
    return false;
  }
}
