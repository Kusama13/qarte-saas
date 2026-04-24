import { resend, EMAIL_FROM, EMAIL_REPLY_TO, EMAIL_HEADERS, getEmailHeaders } from './resend';
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
  IncompleteSignupReminder2Email,
  ProgramReminderDay2Email,
  ProgramReminderDay3Email,
  InactiveMerchantDay7Email,
  InactiveMerchantDay14Email,
  InactiveMerchantDay30Email,
  QRCodeEmail,
  FirstScanEmail,
  FirstBookingEmail,
  FirstRewardEmail,
  WeeklyDigestEmail,
  BlogDigestEmail,
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
  BookingNotificationEmail,
  BookingRescheduledEmail,
  BookingCancelledEmail,
  SmsQuotaEmail,
  VitrineReminderEmail,
  PlanningReminderEmail,
  ChurnSurveyReminderEmail,
  ReferralPromoEmail,
  ReferralReminderEmail,
  SocialProofEmail,
  SlotReleasedEmail,
  PostSurveyFollowUpEmail,
  PostSurveyLastChanceEmail,
  AmbassadorWelcomeEmail,
  ActivationStalledEmail,
  UpgradeAllInEmail,
  type UpgradeTrigger,
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
// Retries up to 2 times with exponential backoff on transient failures
// ---------------------------------------------------------------------------
const MAX_RETRIES = 2;

async function sendEmail<P extends Record<string, unknown>>(
  to: string,
  subject: string,
  Component: (props: P) => React.JSX.Element,
  props: P,
  options?: { scheduledAt?: string; replyTo?: string; logLabel?: string; merchantId?: string }
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  const label = options?.logLabel ?? subject;

  try {
    const element = Component(props);
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { error } = await resend!.emails.send({
          from: EMAIL_FROM,
          to,
          replyTo: options?.replyTo ?? EMAIL_REPLY_TO,
          subject,
          html,
          text,
          headers: getEmailHeaders(options?.merchantId),
          tags: [{ name: 'category', value: options?.logLabel?.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'general' }],
          ...(options?.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
        });

        if (error) {
          // Resend SDK v6 returns network failures as { error: { name: 'application_error', statusCode: null } }
          // instead of throwing — retry these like thrown exceptions
          if (error.statusCode === null && attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }
          // API-level error (validation, quota, bad from address) — no retry
          logger.error(`Failed to send ${label}`, error);
          return { success: false, error: error.message };
        }

        logger.info(`${label} sent to ${to}`);
        return { success: true };
      } catch (sendErr) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        throw sendErr;
      }
    }

    return { success: false, error: 'Max retries exceeded' };
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
  options?: { logLabel?: string; merchantId?: string }
): Promise<ScheduleEmailResult> {
  const check = checkResend();
  if (check) return { success: false, error: check.error };

  const label = options?.logLabel ?? subject;

  try {
    const element = Component(props);
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);

    const { data, error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: getEmailHeaders(options?.merchantId),
      tags: [{ name: 'category', value: label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) }],
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

interface TrialEndingStats {
  activationState?: 0 | 1 | 2 | 3;
  customerCount?: number;
  bookingCount?: number;
  firstPillar?: 'fidelity' | 'planning' | 'vitrine' | null;
}

/**
 * Subject routing — 4 variantes state-aware (plan v2 §3).
 * Fallback sur legacy trialEndingDays si activationState non fourni.
 */
function pickTrialEndingSubject(
  locale: EmailLocale,
  shopName: string,
  daysRemaining: number,
  stats: TrialEndingStats,
): string {
  const { activationState, customerCount = 0, bookingCount = 0, firstPillar } = stats;

  if (activationState === undefined) {
    return daysRemaining <= 1
      ? subj(locale, 'trialEndingLastDay', { shopName })
      : subj(locale, 'trialEndingDays', { shopName, daysRemaining });
  }

  if (activationState === 0) {
    return subj(locale, 'trialEndingS0', { shopName });
  }
  if (activationState === 1) {
    if (firstPillar === 'planning' && bookingCount > 0) {
      return subj(locale, 'trialEndingS1Planning', { shopName, bookingCount });
    }
    return subj(locale, 'trialEndingS1Fidelity', { shopName, customerCount });
  }
  if (activationState === 2) {
    return subj(locale, 'trialEndingS2', { shopName, customerCount });
  }
  return subj(locale, 'trialEndingS3', { shopName, customerCount, bookingCount });
}

export async function sendTrialEndingEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr',
  recommendedTier: 'fidelity' | 'all_in' | null = null,
  stats: TrialEndingStats = {},
): Promise<SendEmailResult> {
  const subject = pickTrialEndingSubject(locale, shopName, daysRemaining, stats);

  return sendEmail(
    to,
    subject,
    TrialEndingEmail,
    {
      shopName,
      daysRemaining,
      recommendedTier,
      activationState: stats.activationState,
      customerCount: stats.customerCount,
      bookingCount: stats.bookingCount,
      locale,
    },
    {
      logLabel: `Trial ending email (${daysRemaining}d, S${stats.activationState ?? '?'}, tier: ${recommendedTier ?? 'none'})`,
    }
  );
}

export async function sendTrialExpiredEmail(
  to: string,
  shopName: string,
  daysUntilDeletion: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'trialExpired', { shopName }), TrialExpiredEmail, { shopName, daysUntilDeletion, locale }, {
    logLabel: `Trial expired email (${daysUntilDeletion} days until deletion)`,
  });
}

export async function sendUpgradeAllInEmail(
  to: string,
  shopName: string,
  trigger: UpgradeTrigger,
  locale: EmailLocale = 'fr',
  triggerContext?: string,
): Promise<SendEmailResult> {
  const subjectKey = trigger === 'sms_campaign_blocked' ? 'upgradeAllInSmsBlocked' : 'upgradeAllInBookingRequest';
  return sendEmail(
    to,
    subj(locale, subjectKey, { shopName, context: triggerContext ?? '' }),
    UpgradeAllInEmail,
    { shopName, trigger, triggerContext, locale },
    { logLabel: `Upgrade All-in email (trigger: ${trigger})` }
  );
}

export async function sendActivationStalledEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr',
  shopType: string | null = null,
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'activationStalled', { shopName }), ActivationStalledEmail, { shopName, shopType, locale }, {
    logLabel: `Activation stalled email (S0 J+3)`,
  });
}

export async function sendChurnSurveyReminderEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'churnSurveyReminder', { shopName }), ChurnSurveyReminderEmail, { shopName, locale }, {
    logLabel: 'Churn survey reminder email (J+3)',
  });
}

// Post-survey follow-up (targeted by Q4 variant)
const FOLLOW_UP_SUBJECT_KEYS: Record<string, string> = {
  lower_price: 'postSurveyFollowUpLowerPrice',
  longer_trial: 'postSurveyFollowUpLongerTrial',
  team_demo: 'postSurveyFollowUpTeamDemo',
  more_features: 'postSurveyFollowUpMoreFeatures',
  fidelity_tier_ok: 'postSurveyFollowUpFidelityTierOk',
  nothing: 'postSurveyFollowUpNothing',
};

export async function sendPostSurveyFollowUpEmail(
  to: string,
  shopName: string,
  variant: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  const subjectKey = daysRemaining <= 1 ? 'postSurveyFollowUpLastDay' : (FOLLOW_UP_SUBJECT_KEYS[variant] || 'postSurveyFollowUpNothing');
  return sendEmail(to, subj(locale, subjectKey, { shopName }), PostSurveyFollowUpEmail, { shopName, variant, daysRemaining, locale }, {
    logLabel: `Post-survey follow-up (${variant}, ${daysRemaining <= 1 ? 'last day' : 'mid'})`,
  });
}

const LAST_CHANCE_SUBJECT_KEYS: Record<string, string> = {
  lower_price: 'postSurveyLastChanceLowerPrice',
};

export async function sendPostSurveyLastChanceEmail(
  to: string,
  shopName: string,
  variant: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  const subjectKey = LAST_CHANCE_SUBJECT_KEYS[variant] || 'postSurveyLastChance';
  return sendEmail(to, subj(locale, subjectKey, { shopName }), PostSurveyLastChanceEmail, { shopName, variant, locale }, {
    logLabel: `Post-survey last chance (${variant})`,
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
  locale: EmailLocale = 'fr',
  planTier: 'fidelity' | 'all_in' = 'all_in',
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'subscriptionConfirmed', { shopName }), SubscriptionConfirmedEmail, { shopName, nextBillingDate, billingInterval, planTier, locale }, {
    logLabel: `Subscription confirmed email (tier: ${planTier})`,
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
  locale: EmailLocale = 'fr',
  step: 1 | 2 | 3 | 4 = 1
): Promise<SendEmailResult> {
  const subjectKey = step === 1 ? 'paymentFailed' : `paymentFailedStep${step}`;
  return sendEmail(to, subj(locale, subjectKey, { shopName }), PaymentFailedEmail, { shopName, step, locale }, { logLabel: `Payment failed email (step ${step})` });
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

const INCOMPLETE_SIGNUP_CONFIGS = {
  1: { subjectKey: 'incompleteSignup', Component: IncompleteSignupEmail, label: 'Incomplete signup email' },
  2: { subjectKey: 'incompleteSignup2', Component: IncompleteSignupReminder2Email, label: 'Incomplete signup reminder 2' },
} as const;

export async function scheduleIncompleteSignupEmail(
  to: string,
  delayMinutes: number = 60,
  locale: EmailLocale = 'fr',
  step: 1 | 2 = 1
): Promise<ScheduleEmailResult> {
  const config = INCOMPLETE_SIGNUP_CONFIGS[step];
  const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
  return scheduleEmail(to, subj(locale, config.subjectKey), config.Component, { email: to, locale }, scheduledAt, {
    logLabel: `${config.label} (in ${delayMinutes} min)`,
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
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  let subject: string;
  if (daysSinceCancellation <= 7) {
    subject = totalCustomers
      ? subj(locale, 'reactivationEarly', { shopName, totalCustomers })
      : subj(locale, 'reactivationEarlyGeneric', { shopName });
  } else if (daysSinceCancellation <= 14) {
    subject = subj(locale, 'reactivationMid', { shopName });
  } else {
    subject = subj(locale, 'reactivationLate', { shopName });
  }

  return sendEmail(to, subject, ReactivationEmail, { shopName, daysSinceCancellation, totalCustomers, locale }, {
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
  return sendEmail(to, subj(locale, 'inactiveDay14', { shopName }), InactiveMerchantDay14Email, { shopName, rewardDescription, stampsRequired, locale }, {
    logLabel: 'Inactive merchant day 14 email',
  });
}

export async function sendInactiveMerchantDay30Email(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr',
  planTier: 'fidelity' | 'all_in' = 'all_in',
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'inactiveDay30', { shopName }), InactiveMerchantDay30Email, { shopName, planTier, locale }, {
    logLabel: `Inactive merchant day 30 email (tier: ${planTier})`,
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

export async function sendFirstBookingEmail(
  to: string,
  shopName: string,
  slug?: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'firstBooking', { shopName }), FirstBookingEmail, { shopName, slug, locale }, {
    logLabel: 'First booking email',
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

export async function sendBlogDigestEmail(
  to: string,
  shopName: string,
  article: {
    title: string;
    description: string;
    category: string;
    readTime: string;
    imageUrl: string;
    url: string;
  },
  merchantId: string,
  locale: EmailLocale = 'fr',
): Promise<SendEmailResult> {
  return sendEmail(
    to,
    subj(locale, 'blogDigest', { shopName }),
    BlogDigestEmail,
    {
      shopName,
      articleTitle: article.title,
      articleDescription: article.description,
      articleCategory: article.category,
      articleReadTime: article.readTime,
      articleImageUrl: article.imageUrl,
      articleUrl: article.url,
      locale,
    },
    {
      logLabel: 'Blog digest email',
      merchantId,
    },
  );
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
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'challengeCompleted', { shopName }), ChallengeCompletedEmail, { shopName, locale }, {
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

export async function sendVitrineReminderEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'vitrineReminder', { shopName }), VitrineReminderEmail, { shopName, daysRemaining, locale }, {
    logLabel: 'Vitrine reminder email',
  });
}

export async function sendPlanningReminderEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'planningReminder', { shopName }), PlanningReminderEmail, { shopName, daysRemaining, locale }, {
    logLabel: 'Planning reminder email',
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
  locale: EmailLocale = 'fr',
  isSubscribed: boolean = false
): Promise<SendEmailResult> {
  const plural = clientNames.length > 1 ? 's' : '';
  return sendEmail(to, subj(locale, 'birthdayNotification', { plural }), BirthdayNotificationEmail, { shopName, clientNames, giftDescription, isSubscribed, locale }, {
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

interface BookingNotificationParams {
  shopName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  services: { name: string; price: number; duration: number }[];
  totalDuration: number;
  totalPrice: number;
  deposit: { link: string; percent: number | null; amount: number | null } | null;
  locale: EmailLocale;
}

export async function sendBookingNotificationEmail(
  to: string,
  params: BookingNotificationParams
): Promise<SendEmailResult> {
  const subject = params.locale === 'en'
    ? `New booking — ${params.clientName}`
    : `Nouvelle reservation — ${params.clientName}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sendEmail(to, subject, BookingNotificationEmail as any, params as any, {
    logLabel: 'Booking notification email',
  });
}

interface BookingRescheduledParams {
  shopName: string;
  clientName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  locale: EmailLocale;
}

export async function sendBookingRescheduledEmail(
  to: string,
  params: BookingRescheduledParams
): Promise<SendEmailResult> {
  const subject = params.locale === 'en'
    ? `Appointment moved — ${params.clientName}`
    : `RDV deplace — ${params.clientName}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sendEmail(to, subject, BookingRescheduledEmail as any, params as any, {
    logLabel: 'Booking rescheduled email',
  });
}

interface BookingCancelledParams {
  shopName: string;
  clientName: string;
  date: string;
  time: string;
  locale: EmailLocale;
}

export async function sendBookingCancelledEmail(
  to: string,
  params: BookingCancelledParams
): Promise<SendEmailResult> {
  const subject = params.locale === 'en'
    ? `Appointment cancelled — ${params.clientName}`
    : `RDV annule — ${params.clientName}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sendEmail(to, subject, BookingCancelledEmail as any, params as any, {
    logLabel: 'Booking cancelled email',
  });
}

export async function sendReferralPromoEmail(
  to: string,
  shopName: string,
  slug: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'referralPromo'), ReferralPromoEmail, { shopName, slug, locale }, {
    logLabel: 'Referral promo email',
  });
}

export async function sendReferralReminderEmail(
  to: string,
  shopName: string,
  slug: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'referralReminder', { shopName }), ReferralReminderEmail, { shopName, slug, locale }, {
    logLabel: 'Referral reminder email',
  });
}

export async function sendSlotReleasedEmail(
  to: string,
  params: { shopName: string; clientName: string; date: string; time: string; locale?: EmailLocale }
): Promise<SendEmailResult> {
  const locale = params.locale || 'fr';
  const subject = locale === 'en'
    ? `Slot released — ${params.clientName}`
    : `Créneau libéré — ${params.clientName}`;
  return sendEmail(to, subject, SlotReleasedEmail as any, {
    shopName: params.shopName,
    clientName: params.clientName,
    date: params.date,
    time: params.time,
    locale,
  } as any, {
    logLabel: 'Slot released email',
  });
}

export async function sendSocialProofEmail(
  to: string,
  shopName: string,
  locale: EmailLocale = 'fr'
): Promise<SendEmailResult> {
  return sendEmail(to, subj(locale, 'socialProof', { shopName }), SocialProofEmail, { shopName, locale }, {
    logLabel: 'Social proof email',
  });
}

export async function sendSmsQuotaEmail(
  to: string,
  shopName: string,
  level: '90' | '100',
  locale: EmailLocale = 'fr',
): Promise<SendEmailResult> {
  const subjectKey = level === '100' ? 'smsQuotaReached' : 'smsQuotaWarning';
  const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com'}/dashboard/marketing?tab=sms&buy=1`;
  return sendEmail(
    to,
    subj(locale, subjectKey, { shopName }),
    SmsQuotaEmail,
    { shopName, level, ctaUrl, locale },
    { logLabel: `SMS quota ${level}% email` },
  );
}

export async function sendAmbassadorWelcomeEmail(
  to: string,
  firstName: string,
  affiliateSlug: string,
): Promise<SendEmailResult> {
  const signupUrl = `https://getqarte.com/auth/merchant/signup?ref=${affiliateSlug}`;
  const homeUrl = `https://getqarte.com/?ref=${affiliateSlug}`;
  return sendEmail(
    to,
    `${firstName}, voici ton lien ambassadeur Qarte !`,
    AmbassadorWelcomeEmail,
    { firstName, affiliateSlug, signupUrl, homeUrl },
    { logLabel: 'Ambassador welcome email' }
  );
}
