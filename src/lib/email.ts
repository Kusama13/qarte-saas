import { resend, EMAIL_FROM, EMAIL_REPLY_TO, EMAIL_HEADERS } from './resend';
import { render } from '@react-email/render';
import {
  WelcomeEmail,
  TrialEndingEmail,
  TrialExpiredEmail,
  SubscriptionConfirmedEmail,
  PendingPointsEmail,
  PaymentFailedEmail,
  SubscriptionCanceledEmail,
  ReactivationEmail,
  ProgramReminderEmail,
  IncompleteSignupEmail,
  ProgramReminderDay2Email,
  ProgramReminderDay3Email,
  InactiveMerchantDay7Email,
  InactiveMerchantDay14Email,
  InactiveMerchantDay30Email,
  QRCodeEmail,
  FirstScanEmail,
  FirstRewardEmail,
  WeeklyDigestEmail,
  Day5CheckinEmail,
  Tier2UpsellEmail,
  SubscriptionReactivatedEmail,
  FirstClientScriptEmail,
  QuickCheckEmail,
  ProductUpdateEmail,
  ChallengeCompletedEmail,
  GuidedSignupEmail,
  AutoSuggestRewardEmail,
  GracePeriodSetupEmail,
  BirthdayNotificationEmail,
  AnnouncementMaPageEmail,
  WinBackEmail,
} from '@/emails';
import { getEmailT, type EmailLocale } from '@/emails/translations';
import logger from './logger';

function checkResend() {
  if (!resend) {
    logger.error('[EMAIL] RESEND_API_KEY not configured - resend client is null');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  return null;
}

/** Helper to get a translated subject */
function subj(locale: EmailLocale, key: string, params?: Record<string, string | number>): string {
  const t = getEmailT(locale);
  return t(`subjects.${key}`, params);
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Factory: sendEmail — encapsulates the render + send + error-handling pattern
// ---------------------------------------------------------------------------
async function sendEmail<P extends Record<string, unknown>>(
  to: string,
  subject: string,
  Component: (props: P) => React.JSX.Element,
  props: P,
  options?: { scheduledAt?: string; replyTo?: string; logLabel?: string }
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  const label = options?.logLabel ?? subject;

  try {
    const html = await render(Component(props));
    const text = await render(Component(props), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: options?.replyTo ?? EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: EMAIL_HEADERS,
      ...(options?.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
    });

    if (error) {
      logger.error(`Failed to send ${label}`, error);
      return { success: false, error: error.message };
    }

    logger.info(`${label} sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error sending ${label}`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// ---------------------------------------------------------------------------
// Factory: scheduleEmail — like sendEmail but returns emailId for cancellation
// ---------------------------------------------------------------------------
interface ScheduleEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

async function scheduleEmail<P extends Record<string, unknown>>(
  to: string,
  subject: string,
  Component: (props: P) => React.JSX.Element,
  props: P,
  scheduledAt: string,
  options?: { logLabel?: string }
): Promise<ScheduleEmailResult> {
  const check = checkResend();
  if (check) return { success: false, error: check.error };

  const label = options?.logLabel ?? subject;

  try {
    const html = await render(Component(props));
    const text = await render(Component(props), { plainText: true });

    const { data, error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: EMAIL_HEADERS,
      scheduledAt,
    });

    if (error) {
      logger.error(`Failed to schedule ${label}`, error);
      return { success: false, error: error.message };
    }

    logger.info(`${label} scheduled for ${to} (id: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    logger.error(`Error scheduling ${label}`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule email' };
  }
}

// ===========================================================================
// Exported email functions — thin wrappers around sendEmail / scheduleEmail
// ===========================================================================

export async function sendWelcomeEmail(
  to: string,
  shopName: string,
  slug?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'welcome', { shopName }), WelcomeEmail, { shopName, slug, locale }, { logLabel: 'Welcome email' });
}

export async function sendTrialEndingEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  promoCode?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  const subject = daysRemaining <= 1
    ? promoCode
      ? subj(locale, 'trialEndingLastDayPromo', { shopName })
      : subj(locale, 'trialEndingLastDay', { shopName })
    : subj(locale, 'trialEndingDays', { daysRemaining });

  return sendEmail(to, subject, TrialEndingEmail, { shopName, daysRemaining, promoCode, locale }, {
    logLabel: `Trial ending email (${daysRemaining} days)`,
  });
}

export async function sendTrialExpiredEmail(
  to: string,
  shopName: string,
  daysUntilDeletion: number,
  promoCode?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  const subject = promoCode
    ? subj(locale, 'trialExpiredPromo', { shopName })
    : subj(locale, 'trialExpired', { shopName });

  return sendEmail(to, subject, TrialExpiredEmail, { shopName, daysUntilDeletion, promoCode, locale }, {
    logLabel: `Trial expired email (${daysUntilDeletion} days until deletion)`,
  });
}

// Notification interne nouveau commerçant (always FR — internal)
export async function sendNewMerchantNotification(
  shopName: string,
  shopType: string,
  shopAddress: string,
  phone: string,
  email: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const htmlContent = `
      <h2>Nouveau commerçant inscrit sur Qarte</h2>
      <p><strong>Commerce :</strong> ${esc(shopName)}</p>
      <p><strong>Type :</strong> ${esc(shopType)}</p>
      <p><strong>Adresse :</strong> ${esc(shopAddress)}</p>
      <p><strong>Téléphone :</strong> ${esc(phone)}</p>
      <p><strong>Email :</strong> ${esc(email)}</p>
      <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
    `;
    const textContent = `Nouveau commerçant inscrit sur Qarte\n\nCommerce : ${shopName}\nType : ${shopType}\nAdresse : ${shopAddress}\nTéléphone : ${phone}\nEmail : ${email}\nDate : ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`;

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to: 'sales@getqarte.com',
      subject: `Nouveau commerçant inscrit : ${shopName}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      logger.error('Failed to send new merchant notification', error);
      return { success: false, error: error.message };
    }

    logger.info(`New merchant notification sent for ${shopName}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending new merchant notification', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

export async function sendSubscriptionConfirmedEmail(
  to: string,
  shopName: string,
  nextBillingDate?: string,
  billingInterval?: 'monthly' | 'annual',
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'subscriptionConfirmed', { shopName }), SubscriptionConfirmedEmail, { shopName, nextBillingDate, billingInterval, locale }, {
    logLabel: 'Subscription confirmed email',
  });
}

export async function sendPendingPointsEmail(
  to: string,
  shopName: string,
  pendingCount: number,
  isReminder = false,
  daysSinceFirst?: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  const plural = pendingCount > 1 ? 's' : '';
  const subject = isReminder
    ? subj(locale, 'pendingPointsReminder', { shopName, pendingCount, plural })
    : subj(locale, 'pendingPoints', { shopName, pendingCount, plural });

  return sendEmail(to, subject, PendingPointsEmail, { shopName, pendingCount, isReminder, daysSinceFirst, locale }, {
    logLabel: `Pending points email (${pendingCount} pending, reminder: ${isReminder})`,
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'paymentFailed'), PaymentFailedEmail, { shopName, locale }, { logLabel: 'Payment failed email' });
}

export async function sendSubscriptionCanceledEmail(
  to: string,
  shopName: string,
  endDate?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'subscriptionCanceled', { shopName }), SubscriptionCanceledEmail, { shopName, endDate, locale }, {
    logLabel: 'Subscription canceled email',
  });
}

export async function sendSubscriptionReactivatedEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'subscriptionReactivated', { shopName }), SubscriptionReactivatedEmail, { shopName, locale }, {
    logLabel: 'Subscription reactivated email',
  });
}

export async function scheduleIncompleteSignupEmail(
  to: string,
  delayMinutes: number = 60,
  locale: EmailLocale = 'fr'
): Promise<ScheduleEmailResult> {
  const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
  return scheduleEmail(to, subj(locale, 'incompleteSignup'), IncompleteSignupEmail, { email: to, locale }, scheduledAt, {
    logLabel: `Incomplete signup email (in ${delayMinutes} min)`,
  });
}

// Annuler un email programmé via Resend
export async function cancelScheduledEmail(emailId: string): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const { error } = await resend!.emails.cancel(emailId);

    if (error) {
      if (error.message?.includes('already sent') || error.message?.includes('not found')) {
        logger.info(`Email ${emailId} was already sent or not found, skipping cancel`);
        return { success: true };
      }
      logger.error('Failed to cancel scheduled email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Scheduled email ${emailId} canceled`);
    return { success: true };
  } catch (error) {
    logger.error('Error canceling scheduled email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel email' };
  }
}

export async function sendProgramReminderEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'programReminder', { shopName }), ProgramReminderEmail, { shopName, locale }, {
    logLabel: 'Program reminder email',
  });
}

export async function sendReactivationEmail(
  to: string,
  shopName: string,
  daysSinceCancellation: number,
  totalCustomers?: number,
  promoCode?: string,
  promoMonths?: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  let subject: string;
  if (promoCode && promoMonths && promoMonths >= 3) {
    subject = subj(locale, 'reactivationPromoLong', { shopName, promoMonths });
  } else if (promoCode && daysSinceCancellation >= 14) {
    subject = subj(locale, 'reactivationPromo', { shopName, promoMonths: promoMonths || 1 });
  } else if (daysSinceCancellation <= 7) {
    subject = totalCustomers
      ? subj(locale, 'reactivationEarly', { shopName, totalCustomers })
      : subj(locale, 'reactivationEarlyGeneric', { shopName });
  } else if (daysSinceCancellation <= 14) {
    subject = subj(locale, 'reactivationMid', { shopName });
  } else {
    subject = subj(locale, 'reactivationLate', { shopName });
  }

  return sendEmail(to, subject, ReactivationEmail, { shopName, daysSinceCancellation, totalCustomers, promoCode, promoMonths, locale }, {
    logLabel: `Reactivation email (${daysSinceCancellation} days since cancellation)`,
  });
}

export async function sendProgramReminderDay2Email(
  to: string,
  shopName: string,
  shopType: string,
  slug?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'programReminderDay2'), ProgramReminderDay2Email, { shopName, shopType, slug, locale }, {
    logLabel: 'Program reminder day 2 email',
  });
}

export async function sendProgramReminderDay3Email(
  to: string,
  shopName: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'programReminderDay3'), ProgramReminderDay3Email, { shopName, daysRemaining, locale }, {
    logLabel: 'Program reminder day 3 email',
  });
}

export async function sendInactiveMerchantDay7Email(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'inactiveDay7', { shopName }), InactiveMerchantDay7Email, { shopName, locale }, {
    logLabel: 'Inactive merchant day 7 email',
  });
}

export async function sendInactiveMerchantDay14Email(
  to: string,
  shopName: string,
  rewardDescription?: string,
  stampsRequired?: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'inactiveDay14'), InactiveMerchantDay14Email, { shopName, rewardDescription, stampsRequired, locale }, {
    logLabel: 'Inactive merchant day 14 email',
  });
}

export async function sendInactiveMerchantDay30Email(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'inactiveDay30', { shopName }), InactiveMerchantDay30Email, { shopName, locale }, {
    logLabel: 'Inactive merchant day 30 email',
  });
}

export async function sendQRCodeEmail(
  to: string,
  shopName: string,
  rewardDescription?: string,
  stampsRequired?: number,
  primaryColor?: string,
  logoUrl?: string,
  tier2Enabled?: boolean,
  tier2StampsRequired?: number | null,
  tier2RewardDescription?: string | null,
  loyaltyMode?: 'visit' | 'cagnotte',
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'qrCode', { shopName }), QRCodeEmail, {
    shopName,
    rewardDescription,
    stampsRequired,
    primaryColor,
    logoUrl,
    tier2Enabled,
    tier2StampsRequired,
    tier2RewardDescription,
    loyaltyMode,
    locale,
  }, {
    logLabel: 'QR code email',
  });
}

export async function sendFirstScanEmail(
  to: string,
  shopName: string,
  referralCode?: string,
  slug?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'firstScan', { shopName }), FirstScanEmail, { shopName, referralCode, slug, locale }, {
    logLabel: 'First scan email',
  });
}

export async function sendFirstRewardEmail(
  to: string,
  shopName: string,
  rewardDescription: string,
  isCagnotte?: boolean,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'firstReward'), FirstRewardEmail, { shopName, rewardDescription, isCagnotte, locale }, {
    logLabel: 'First reward email',
  });
}

export async function sendWeeklyDigestEmail(
  to: string,
  shopName: string,
  scansThisWeek: number,
  newCustomers: number,
  rewardsEarned: number,
  totalCustomers: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'weeklyDigest', { shopName }), WeeklyDigestEmail, { shopName, scansThisWeek, newCustomers, rewardsEarned, totalCustomers, locale }, {
    logLabel: 'Weekly digest email',
  });
}

export async function sendDay5CheckinEmail(
  to: string,
  shopName: string,
  totalScans: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'day5Checkin', { shopName }), Day5CheckinEmail, { shopName, totalScans, locale }, {
    logLabel: 'Day 5 checkin email',
  });
}

export async function sendTier2UpsellEmail(
  to: string,
  shopName: string,
  totalCustomers: number,
  rewardDescription: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'tier2Upsell'), Tier2UpsellEmail, { shopName, totalCustomers, rewardDescription, locale }, {
    logLabel: 'Tier 2 upsell email',
  });
}

export async function sendFirstClientScriptEmail(
  to: string,
  shopName: string,
  shopType: string,
  rewardDescription: string,
  stampsRequired: number,
  loyaltyMode?: 'visit' | 'cagnotte',
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'firstClientScript'), FirstClientScriptEmail, { shopName, shopType, rewardDescription, stampsRequired, loyaltyMode, locale }, {
    logLabel: 'First client script email',
  });
}

export async function sendQuickCheckEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'quickCheck', { shopName }), QuickCheckEmail, { shopName, daysRemaining, locale }, {
    logLabel: 'Quick check email',
  });
}

export async function sendChallengeCompletedEmail(
  to: string,
  shopName: string,
  promoCode: string = 'QARTECHALLENGE2026',
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'challengeCompleted', { shopName }), ChallengeCompletedEmail, { shopName, promoCode, locale }, {
    logLabel: 'Challenge completed email',
  });
}

export async function sendProductUpdateEmail(
  to: string,
  shopName: string,
  merchantId: string,
  referralCode?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'productUpdate', { shopName }), ProductUpdateEmail, { shopName, merchantId, referralCode, locale }, {
    logLabel: 'Product update email',
  });
}

export async function sendGuidedSignupEmail(
  to: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'guidedSignup'), GuidedSignupEmail, { email: to, locale }, {
    logLabel: 'Guided signup email',
  });
}

export async function sendAutoSuggestRewardEmail(
  to: string,
  shopName: string,
  shopType: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'autoSuggestReward', { shopName }), AutoSuggestRewardEmail, { shopName, shopType, daysRemaining, locale }, {
    logLabel: 'Auto-suggest reward email',
  });
}

export async function sendGracePeriodSetupEmail(
  to: string,
  shopName: string,
  daysUntilDeletion: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'gracePeriodSetup', { shopName, daysUntilDeletion }), GracePeriodSetupEmail, { shopName, daysUntilDeletion, locale }, {
    logLabel: 'Grace period setup email',
  });
}

export async function sendBirthdayNotificationEmail(
  to: string,
  shopName: string,
  clientNames: string[],
  giftDescription: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  const plural = clientNames.length > 1 ? 's' : '';
  return sendEmail(to, subj(locale, 'birthdayNotification', { plural }), BirthdayNotificationEmail, { shopName, clientNames, giftDescription, locale }, {
    logLabel: 'Birthday notification email',
  });
}

export async function sendAnnouncementMaPageEmail(
  to: string,
  shopName: string,
  slug: string,
  isSubscribed: boolean = true,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'announcementMaPage', { shopName }), AnnouncementMaPageEmail, { shopName, slug, isSubscribed, locale }, {
    logLabel: 'Announcement Ma Page email',
  });
}

export async function sendWinBackEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'winBack', { shopName }), WinBackEmail, { shopName, locale }, {
    logLabel: 'Win-back email',
  });
}
