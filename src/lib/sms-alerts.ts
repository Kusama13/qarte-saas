import type { SupabaseClient } from '@supabase/supabase-js';
import { sendMerchantPush } from './merchant-push';
import { sendSmsQuotaEmail } from './email';
import type { EmailLocale } from '@/emails/translations';
import { canEmail } from './cron-helpers';
import logger from './logger';

export type SmsQuotaLevel = '80' | '90' | '100';

/**
 * Notify a merchant they've hit a SMS quota threshold (80% / 90% / 100%).
 * Fire-and-forget: sends push + email in parallel, respects canEmail() + dedup per cycle.
 * Dedup is stored in merchants.sms_alert_{80,90,100}_sent_cycle (DATE of billing cycle start).
 *
 * Niveaux :
 * - 80% : push seulement (early warning léger)
 * - 90% : email + push avec lien achat pack (alerte principale, plage actionnable)
 * - 100% : email + push (blocage hard côté sms.ts) — relance critique pour les
 *          merchants qui ont raté l'email à 90% (spam, vacances, etc.)
 */
export async function notifyMerchantQuotaAlert(
  supabase: SupabaseClient,
  merchantId: string,
  level: SmsQuotaLevel,
  billingCycleStart: string, // YYYY-MM-DD of current cycle
): Promise<void> {
  const flagCol = level === '80' ? 'sms_alert_80_sent_cycle'
    : level === '90' ? 'sms_alert_90_sent_cycle'
    : 'sms_alert_100_sent_cycle';

  // Dedup: only send once per cycle
  const { data: merchant } = await supabase
    .from('merchants')
    .select(`id, shop_name, user_id, locale, no_contact, email_bounced_at, email_unsubscribed_at, ${flagCol}`)
    .eq('id', merchantId)
    .maybeSingle();

  if (!merchant) return;
  const row = merchant as Record<string, unknown>;
  if (row[flagCol] === billingCycleStart) return; // already sent this cycle

  // Mark flag FIRST to prevent duplicate sends if this function is racing
  await supabase.from('merchants').update({ [flagCol]: billingCycleStart }).eq('id', merchantId);

  const shopName = (row.shop_name as string) || 'Qarte';
  const locale = ((row.locale as string) || 'fr') as EmailLocale;

  let pushTitle: string;
  let pushBody: string;
  if (level === '100') {
    pushTitle = locale === 'en' ? 'SMS quota done — buy a pack' : 'Ton quota SMS est terminé';
    pushBody = locale === 'en' ? 'Buy a pack to unblock your sends.' : 'Merci d\'acheter un pack pour continuer à envoyer.';
  } else if (level === '90') {
    pushTitle = locale === 'en' ? '90% SMS used — buy a pack' : 'Quota SMS à 90% — achète un pack';
    pushBody = locale === 'en' ? 'Anticipate now to avoid interruption.' : 'Anticipe maintenant pour éviter l\'interruption.';
  } else {
    pushTitle = locale === 'en' ? 'You\'re close to your SMS limit' : 'Tu approches de ta limite SMS';
    pushBody = locale === 'en' ? 'Anticipate with an SMS pack.' : 'Anticipe avec un pack SMS.';
  }

  const pushPromise = sendMerchantPush({
    supabase,
    merchantId,
    notificationType: `sms_quota_${level}`,
    referenceId: billingCycleStart,
    title: pushTitle,
    body: pushBody,
    url: '/dashboard/marketing?tab=sms&buy=1',
    tag: `qarte-sms-quota-${level}`,
  }).catch((err) => {
    logger.error('notifyMerchantQuotaAlert push error', err);
    return false;
  });

  // Email aux niveaux 90% (anticipation) ET 100% (blocage). Pas d'email à 80% — push suffit.
  // Le template SmsQuotaEmail gère deux variantes ('90' = warning, '100' = reached/blocked).
  let emailPromise: Promise<unknown> = Promise.resolve();
  if ((level === '90' || level === '100') && canEmail({
    no_contact: row.no_contact as boolean | null,
    email_bounced_at: row.email_bounced_at as string | null,
    email_unsubscribed_at: row.email_unsubscribed_at as string | null,
  })) {
    const { data: userData } = await supabase.auth.admin.getUserById(row.user_id as string);
    const email = userData?.user?.email;
    if (email) {
      emailPromise = sendSmsQuotaEmail(email, shopName, level, locale).catch((err) => {
        logger.error('notifyMerchantQuotaAlert email error', err);
      });
    }
  }

  await Promise.allSettled([pushPromise, emailPromise]);
}
