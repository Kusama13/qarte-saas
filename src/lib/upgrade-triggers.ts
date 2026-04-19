import type { SupabaseClient } from '@supabase/supabase-js';
import { sendUpgradeAllInEmail } from './email';
import { canEmail } from './cron-helpers';
import { TRACKING_CODES } from './email-tracking-codes';
import type { UpgradeTrigger } from '@/emails';
import type { EmailLocale } from '@/emails/translations';
import logger from './logger';

const TRIGGER_TO_TRACKING_CODE: Record<UpgradeTrigger, number> = {
  sms_campaign_blocked: TRACKING_CODES.UPGRADE_SMS_CAMPAIGN_BLOCKED,
  booking_request_manual: TRACKING_CODES.UPGRADE_BOOKING_REQUEST_MANUAL,
};

const COOLDOWN_DAYS = 14;

export async function triggerUpgradeAllInEmail(
  supabase: SupabaseClient,
  merchantId: string,
  trigger: UpgradeTrigger,
  triggerContext?: string,
): Promise<{ sent: boolean; reason?: string }> {
  const trackingCode = TRIGGER_TO_TRACKING_CODE[trigger];
  const cooldownStart = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [trackingRes, merchantRes] = await Promise.all([
    supabase
      .from('pending_email_tracking')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('reminder_day', trackingCode)
      .gte('created_at', cooldownStart)
      .limit(1),
    supabase
      .from('merchants')
      .select('id, shop_name, user_id, locale, no_contact, email_bounced_at, email_unsubscribed_at, subscription_status, plan_tier, created_at')
      .eq('id', merchantId)
      .single(),
  ]);

  if ((trackingRes.data?.length ?? 0) > 0) return { sent: false, reason: 'cooldown_14d' };

  const merchant = merchantRes.data;
  if (!merchant) return { sent: false, reason: 'merchant_not_found' };
  if (!canEmail(merchant)) return { sent: false, reason: 'contact_blocked' };
  if (merchant.plan_tier !== 'fidelity') return { sent: false, reason: 'not_fidelity_tier' };
  if (!['active', 'trial'].includes(merchant.subscription_status)) {
    return { sent: false, reason: 'inactive_subscription' };
  }

  // Respect minimum 30j depuis checkout (skill paywall-upgrade-cro : "not too early")
  const daysSinceCreation = (Date.now() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 30) return { sent: false, reason: 'too_early_since_signup' };

  const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
  const email = userData?.user?.email;
  if (!email) return { sent: false, reason: 'no_email' };

  try {
    await sendUpgradeAllInEmail(
      email,
      merchant.shop_name,
      trigger,
      (merchant.locale as EmailLocale) || 'fr',
      triggerContext,
    );
    await supabase.from('pending_email_tracking').insert({
      merchant_id: merchantId,
      reminder_day: trackingCode,
      pending_count: 0,
    });
    return { sent: true };
  } catch (err) {
    logger.error('upgrade_all_in_email_failed', { merchantId, trigger, err: String(err) });
    return { sent: false, reason: 'send_failed' };
  }
}
