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
  IncompleteSignupReminder2Email,
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
  SetupForYouEmail,
  LastChanceSignupEmail,
  AutoSuggestRewardEmail,
  GracePeriodSetupEmail,
  BirthdayNotificationEmail,
} from '@/emails';
import logger from './logger';

function checkResend() {
  if (!resend) {
    logger.error('[EMAIL] RESEND_API_KEY not configured - resend client is null');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  return null;
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

// Email de bienvenue
export async function sendWelcomeEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  return sendEmail(to, `Bienvenue ${shopName} !`, WelcomeEmail, { shopName }, { logLabel: 'Welcome email' });
}

// Email fin d'essai imminente
export async function sendTrialEndingEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  promoCode?: string
): Promise<SendEmailResult> {
  const subject = daysRemaining <= 1
    ? promoCode
      ? `${shopName}, dernier jour — code promo inside`
      : `${shopName}, dernier jour d'essai`
    : `Plus que ${daysRemaining} jours d'essai`;

  return sendEmail(to, subject, TrialEndingEmail, { shopName, daysRemaining, promoCode }, {
    logLabel: `Trial ending email (${daysRemaining} days)`,
  });
}

// Email essai expiré
export async function sendTrialExpiredEmail(
  to: string,
  shopName: string,
  daysUntilDeletion: number,
  promoCode?: string
): Promise<SendEmailResult> {
  const subject = promoCode
    ? `${shopName}, -10€ pour réactiver votre compte`
    : `${shopName}, votre essai est terminé`;

  return sendEmail(to, subject, TrialExpiredEmail, { shopName, daysUntilDeletion, promoCode }, {
    logLabel: `Trial expired email (${daysUntilDeletion} days until deletion)`,
  });
}

// Notification interne nouveau commerçant
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

// Email confirmation d'abonnement
export async function sendSubscriptionConfirmedEmail(
  to: string,
  shopName: string,
  nextBillingDate?: string,
  billingInterval?: 'monthly' | 'annual'
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName} - Votre abonnement Qarte est actif`, SubscriptionConfirmedEmail, { shopName, nextBillingDate, billingInterval }, {
    logLabel: 'Subscription confirmed email',
  });
}

// Email points en attente (Qarte Shield)
export async function sendPendingPointsEmail(
  to: string,
  shopName: string,
  pendingCount: number,
  isReminder = false,
  daysSinceFirst?: number
): Promise<SendEmailResult> {
  const subject = isReminder
    ? `${shopName} - Rappel : ${pendingCount} point${pendingCount > 1 ? 's' : ''} en attente`
    : `${shopName} - ${pendingCount} point${pendingCount > 1 ? 's' : ''} à modérer`;

  return sendEmail(to, subject, PendingPointsEmail, { shopName, pendingCount, isReminder, daysSinceFirst }, {
    logLabel: `Pending points email (${pendingCount} pending, reminder: ${isReminder})`,
  });
}

// Email paiement échoué
export async function sendPaymentFailedEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  return sendEmail(to, `Un souci avec votre carte`, PaymentFailedEmail, { shopName }, { logLabel: 'Payment failed email' });
}

// Email confirmation de résiliation
export async function sendSubscriptionCanceledEmail(
  to: string,
  shopName: string,
  endDate?: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName} - Confirmation de résiliation`, SubscriptionCanceledEmail, { shopName, endDate }, {
    logLabel: 'Subscription canceled email',
  });
}

// Email confirmation réactivation (annulation de résiliation)
export async function sendSubscriptionReactivatedEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName} - Votre abonnement est maintenu`, SubscriptionReactivatedEmail, { shopName }, {
    logLabel: 'Subscription reactivated email',
  });
}

// Email relance inscription incomplète - PROGRAMME via Resend scheduledAt
export async function scheduleIncompleteSignupEmail(
  to: string,
  delayMinutes: number = 60
): Promise<ScheduleEmailResult> {
  const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
  return scheduleEmail(to, "Il ne reste qu'une étape", IncompleteSignupEmail, { email: to }, scheduledAt, {
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
      // Ignore "already sent" errors - email might have been sent already
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

// Email relance programme non configuré (J+1)
export async function sendProgramReminderEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, lancez votre programme`, ProgramReminderEmail, { shopName }, {
    logLabel: 'Program reminder email',
  });
}

// Email de réactivation (win-back)
export async function sendReactivationEmail(
  to: string,
  shopName: string,
  daysSinceCancellation: number,
  totalCustomers?: number,
  promoCode?: string,
  promoMonths?: number
): Promise<SendEmailResult> {
  // Sujets différenciés selon le timing
  let subject: string;
  if (promoCode && promoMonths && promoMonths >= 3) {
    subject = `${shopName} - Dernière chance : ${promoMonths} mois à 9€`;
  } else if (promoCode && daysSinceCancellation >= 14) {
    subject = `${shopName} - ${promoMonths || 1} mois à 9€ pour revenir sur Qarte`;
  } else if (daysSinceCancellation <= 7) {
    subject = totalCustomers
      ? `${shopName} - Vos ${totalCustomers} clients n'ont plus accès à leur carte`
      : `${shopName} - Vos clients n'ont plus accès à leur carte`;
  } else if (daysSinceCancellation <= 14) {
    subject = `${shopName} - Revenez, vos données sont encore là`;
  } else {
    subject = `${shopName} - Dernière chance avant suppression de vos données`;
  }

  return sendEmail(to, subject, ReactivationEmail, { shopName, daysSinceCancellation, totalCustomers, promoCode, promoMonths }, {
    logLabel: `Reactivation email (${daysSinceCancellation} days since cancellation)`,
  });
}

// Email relance programme non configuré J+2 (personnalisé par shop_type)
export async function sendProgramReminderDay2Email(
  to: string,
  shopName: string,
  shopType: string
): Promise<SendEmailResult> {
  return sendEmail(to, `Quelle récompense choisir ?`, ProgramReminderDay2Email, { shopName, shopType }, {
    logLabel: 'Program reminder day 2 email',
  });
}

// Email relance programme non configuré J+3 (urgence + done-for-you)
export async function sendProgramReminderDay3Email(
  to: string,
  shopName: string,
  daysRemaining: number
): Promise<SendEmailResult> {
  return sendEmail(to, `Dernier rappel : configurez votre programme`, ProgramReminderDay3Email, { shopName, daysRemaining }, {
    logLabel: 'Program reminder day 3 email',
  });
}

// Email commerçant inactif J+7 (diagnostic)
export async function sendInactiveMerchantDay7Email(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, tout va bien ?`, InactiveMerchantDay7Email, { shopName }, {
    logLabel: 'Inactive merchant day 7 email',
  });
}

// Email commerçant inactif J+14 (pression concurrentielle)
export async function sendInactiveMerchantDay14Email(
  to: string,
  shopName: string,
  rewardDescription?: string,
  stampsRequired?: number
): Promise<SendEmailResult> {
  return sendEmail(to, `Comment fidéliser vos clients`, InactiveMerchantDay14Email, { shopName, rewardDescription, stampsRequired }, {
    logLabel: 'Inactive merchant day 14 email',
  });
}

// Email commerçant inactif J+30 (check-in personnel)
export async function sendInactiveMerchantDay30Email(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, on peut vous aider ?`, InactiveMerchantDay30Email, { shopName }, {
    logLabel: 'Inactive merchant day 30 email',
  });
}

// Email QR code + kit promo (après configuration du programme)
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
  loyaltyMode?: 'visit' | 'cagnotte'
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, tout est prêt — lancez votre programme !`, QRCodeEmail, {
    shopName,
    rewardDescription,
    stampsRequired,
    primaryColor,
    logoUrl,
    tier2Enabled,
    tier2StampsRequired,
    tier2RewardDescription,
    loyaltyMode,
  }, {
    logLabel: 'QR code email',
  });
}

// Email relance inscription incomplète #2 - PROGRAMME via Resend scheduledAt
export async function scheduleIncompleteSignupReminder2Email(
  to: string,
  delayMinutes: number = 180
): Promise<ScheduleEmailResult> {
  const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
  return scheduleEmail(to, 'Votre espace Qarte vous attend', IncompleteSignupReminder2Email, { email: to }, scheduledAt, {
    logLabel: `Incomplete signup reminder 2 email (in ${delayMinutes} min)`,
  });
}

// Email premier scan (célébration)
export async function sendFirstScanEmail(
  to: string,
  shopName: string,
  referralCode?: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, votre 1er client !`, FirstScanEmail, { shopName, referralCode }, {
    logLabel: 'First scan email',
  });
}

// Email première récompense débloquée
export async function sendFirstRewardEmail(
  to: string,
  shopName: string,
  rewardDescription: string,
  isCagnotte?: boolean
): Promise<SendEmailResult> {
  return sendEmail(to, `1ère récompense débloquée !`, FirstRewardEmail, { shopName, rewardDescription, isCagnotte }, {
    logLabel: 'First reward email',
  });
}

// Email bilan hebdomadaire
export async function sendWeeklyDigestEmail(
  to: string,
  shopName: string,
  scansThisWeek: number,
  newCustomers: number,
  rewardsEarned: number,
  totalCustomers: number
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName} — votre semaine`, WeeklyDigestEmail, { shopName, scansThisWeek, newCustomers, rewardsEarned, totalCustomers }, {
    logLabel: 'Weekly digest email',
  });
}

// Email check-in J+5 (comble le gap J+3 -> J+7)
export async function sendDay5CheckinEmail(
  to: string,
  shopName: string,
  totalScans: number
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, votre 1ère semaine`, Day5CheckinEmail, { shopName, totalScans }, {
    logLabel: 'Day 5 checkin email',
  });
}

// Email upsell Tier 2 VIP
export async function sendTier2UpsellEmail(
  to: string,
  shopName: string,
  totalCustomers: number,
  rewardDescription: string
): Promise<SendEmailResult> {
  return sendEmail(to, `Vos meilleurs clients méritent plus`, Tier2UpsellEmail, { shopName, totalCustomers, rewardDescription }, {
    logLabel: 'Tier 2 upsell email',
  });
}

// Email script client J+2 après config programme (0 scans)
export async function sendFirstClientScriptEmail(
  to: string,
  shopName: string,
  shopType: string,
  rewardDescription: string,
  stampsRequired: number,
  loyaltyMode?: 'visit' | 'cagnotte'
): Promise<SendEmailResult> {
  return sendEmail(to, `La phrase exacte à dire à vos client(e)s`, FirstClientScriptEmail, { shopName, shopType, rewardDescription, stampsRequired, loyaltyMode }, {
    logLabel: 'First client script email',
  });
}

// Email quick check J+4 après config programme (0 scans)
export async function sendQuickCheckEmail(
  to: string,
  shopName: string,
  daysRemaining: number
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, une question rapide`, QuickCheckEmail, { shopName, daysRemaining }, {
    logLabel: 'Quick check email',
  });
}

// Email challenge réussi (5 clients en 3 jours)
export async function sendChallengeCompletedEmail(
  to: string,
  shopName: string,
  promoCode: string = 'QARTECHALLENGE2026'
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, défi réussi — vos codes promo sont prêts`, ChallengeCompletedEmail, { shopName, promoCode }, {
    logLabel: 'Challenge completed email',
  });
}

// Email nouveautés produit (newsletter)
export async function sendProductUpdateEmail(
  to: string,
  shopName: string,
  merchantId: string,
  referralCode?: string
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, découvrez les nouveautés Qarte de la semaine`, ProductUpdateEmail, { shopName, merchantId, referralCode }, {
    logLabel: 'Product update email',
  });
}

// Email relance inscription incomplète T+24h (guide pas à pas)
export async function sendGuidedSignupEmail(
  to: string
): Promise<SendEmailResult> {
  return sendEmail(to, `30 secondes, on vous guide`, GuidedSignupEmail, { email: to }, {
    logLabel: 'Guided signup email',
  });
}

// Email relance inscription incomplète T+72h (done-for-you)
export async function sendSetupForYouEmail(
  to: string
): Promise<SendEmailResult> {
  return sendEmail(to, `On peut le faire pour vous`, SetupForYouEmail, { email: to }, {
    logLabel: 'Setup-for-you email',
  });
}

// Email relance inscription incomplète T+7j (dernière chance + promo)
export async function sendLastChanceSignupEmail(
  to: string
): Promise<SendEmailResult> {
  return sendEmail(to, `Dernière chance : votre place est réservée`, LastChanceSignupEmail, { email: to }, {
    logLabel: 'Last chance signup email',
  });
}

// Email relance programme non configuré J+5 (auto-suggestion récompense)
export async function sendAutoSuggestRewardEmail(
  to: string,
  shopName: string,
  shopType: string,
  daysRemaining: number
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, on a choisi la meilleure récompense pour vous`, AutoSuggestRewardEmail, { shopName, shopType, daysRemaining }, {
    logLabel: 'Auto-suggest reward email',
  });
}

// Email relance grace period + programme non configuré (J+10 depuis création)
export async function sendGracePeriodSetupEmail(
  to: string,
  shopName: string,
  daysUntilDeletion: number
): Promise<SendEmailResult> {
  return sendEmail(to, `${shopName}, on garde vos données encore ${daysUntilDeletion} jours`, GracePeriodSetupEmail, { shopName, daysUntilDeletion }, {
    logLabel: 'Grace period setup email',
  });
}

// Email notification anniversaire client (envoyé au merchant)
export async function sendBirthdayNotificationEmail(
  to: string,
  shopName: string,
  clientNames: string[],
  giftDescription: string
): Promise<SendEmailResult> {
  const plural = clientNames.length > 1;
  return sendEmail(to, `Anniversaire client${plural ? 's' : ''} aujourd'hui`, BirthdayNotificationEmail, { shopName, clientNames, giftDescription }, {
    logLabel: 'Birthday notification email',
  });
}
