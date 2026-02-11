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
  SocialKitEmail,
  QRCodeEmail,
  FirstScanEmail,
  FirstRewardEmail,
  WeeklyDigestEmail,
  Day5CheckinEmail,
  Tier2UpsellEmail,
  SubscriptionReactivatedEmail,
  FirstClientScriptEmail,
  QuickCheckEmail,
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

// Email de bienvenue
export async function sendWelcomeEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(WelcomeEmail({ shopName }));
    const text = await render(WelcomeEmail({ shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Bienvenue ${shopName} !`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send welcome email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending welcome email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email fin d'essai imminente
export async function sendTrialEndingEmail(
  to: string,
  shopName: string,
  daysRemaining: number,
  promoCode?: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const subject = daysRemaining <= 1
      ? promoCode
        ? `${shopName}, dernier jour — code promo inside`
        : `${shopName}, dernier jour d'essai`
      : `Plus que ${daysRemaining} jours d'essai`;

    const html = await render(TrialEndingEmail({ shopName, daysRemaining, promoCode }));
    const text = await render(TrialEndingEmail({ shopName, daysRemaining, promoCode }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send trial ending email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Trial ending email sent to ${to} (${daysRemaining} days)`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending trial ending email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email essai expiré
export async function sendTrialExpiredEmail(
  to: string,
  shopName: string,
  daysUntilDeletion: number,
  promoCode?: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(TrialExpiredEmail({ shopName, daysUntilDeletion, promoCode }));
    const text = await render(TrialExpiredEmail({ shopName, daysUntilDeletion, promoCode }), { plainText: true });

    const subject = promoCode
      ? `${shopName}, -10€ pour réactiver votre compte`
      : `${shopName}, votre essai est terminé`;

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send trial expired email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Trial expired email sent to ${to} (${daysUntilDeletion} days until deletion)`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending trial expired email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
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
    const htmlContent = `
      <h2>Nouveau commerçant inscrit sur Qarte</h2>
      <p><strong>Commerce :</strong> ${shopName}</p>
      <p><strong>Type :</strong> ${shopType}</p>
      <p><strong>Adresse :</strong> ${shopAddress}</p>
      <p><strong>Téléphone :</strong> ${phone}</p>
      <p><strong>Email :</strong> ${email}</p>
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
  nextBillingDate?: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(SubscriptionConfirmedEmail({ shopName, nextBillingDate }));
    const text = await render(SubscriptionConfirmedEmail({ shopName, nextBillingDate }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName} - Votre abonnement Qarte est actif`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send subscription confirmed email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Subscription confirmed email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending subscription confirmed email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email points en attente (Qarte Shield)
export async function sendPendingPointsEmail(
  to: string,
  shopName: string,
  pendingCount: number,
  isReminder = false,
  daysSinceFirst?: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const subject = isReminder
      ? `${shopName} - Rappel : ${pendingCount} point${pendingCount > 1 ? 's' : ''} en attente`
      : `${shopName} - ${pendingCount} point${pendingCount > 1 ? 's' : ''} à modérer`;

    const html = await render(
      PendingPointsEmail({
        shopName,
        pendingCount,
        isReminder,
        daysSinceFirst,
      })
    );
    const text = await render(
      PendingPointsEmail({
        shopName,
        pendingCount,
        isReminder,
        daysSinceFirst,
      }),
      { plainText: true }
    );

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send pending points email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Pending points email sent to ${to} (${pendingCount} pending, reminder: ${isReminder})`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending pending points email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email paiement échoué
export async function sendPaymentFailedEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(PaymentFailedEmail({ shopName }));
    const text = await render(PaymentFailedEmail({ shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Un souci avec votre carte`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send payment failed email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Payment failed email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending payment failed email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email confirmation de résiliation
export async function sendSubscriptionCanceledEmail(
  to: string,
  shopName: string,
  endDate: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(SubscriptionCanceledEmail({ shopName, endDate }));
    const text = await render(SubscriptionCanceledEmail({ shopName, endDate }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName} - Confirmation de résiliation`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send subscription canceled email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Subscription canceled email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending subscription canceled email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email confirmation réactivation (annulation de résiliation)
export async function sendSubscriptionReactivatedEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(SubscriptionReactivatedEmail({ shopName }));
    const text = await render(SubscriptionReactivatedEmail({ shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName} - Votre abonnement est maintenu`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send subscription reactivated email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Subscription reactivated email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending subscription reactivated email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email relance inscription incomplète - PROGRAMMÉ via Resend scheduledAt
interface ScheduleEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

export async function scheduleIncompleteSignupEmail(
  to: string,
  delayMinutes: number = 60
): Promise<ScheduleEmailResult> {
  const check = checkResend();
  if (check) return { success: false, error: check.error };

  try {
    const html = await render(IncompleteSignupEmail({ email: to }));
    const text = await render(IncompleteSignupEmail({ email: to }), { plainText: true });

    // Schedule for X minutes in the future
    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    const { data, error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: 'Il ne reste qu\'une étape',
      html,
      text,
      headers: EMAIL_HEADERS,
      scheduledAt,
    });

    if (error) {
      logger.error('Failed to schedule incomplete signup email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Incomplete signup email scheduled for ${to} in ${delayMinutes} minutes (id: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    logger.error('Error scheduling incomplete signup email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule email' };
  }
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
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(ProgramReminderEmail({ shopName }));
    const text = await render(ProgramReminderEmail({ shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, lancez votre programme`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send program reminder email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Program reminder email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending program reminder email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
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
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(ReactivationEmail({ shopName, daysSinceCancellation, totalCustomers, promoCode, promoMonths }));
    const text = await render(ReactivationEmail({ shopName, daysSinceCancellation, totalCustomers, promoCode, promoMonths }), { plainText: true });

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

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send reactivation email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Reactivation email sent to ${to} (${daysSinceCancellation} days since cancellation)`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending reactivation email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email relance programme non configuré J+2 (personnalisé par shop_type)
export async function sendProgramReminderDay2Email(
  to: string,
  shopName: string,
  shopType: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(ProgramReminderDay2Email({ shopName, shopType }));
    const text = await render(ProgramReminderDay2Email({ shopName, shopType }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Quelle récompense choisir ?`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send program reminder day 2 email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Program reminder day 2 email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending program reminder day 2 email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email relance programme non configuré J+3 (urgence + done-for-you)
export async function sendProgramReminderDay3Email(
  to: string,
  shopName: string,
  daysRemaining: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(ProgramReminderDay3Email({ shopName, daysRemaining }));
    const text = await render(ProgramReminderDay3Email({ shopName, daysRemaining }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Dernier rappel : configurez votre programme`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send program reminder day 3 email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Program reminder day 3 email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending program reminder day 3 email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email commerçant inactif J+7 (diagnostic)
export async function sendInactiveMerchantDay7Email(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(InactiveMerchantDay7Email({ shopName }));
    const text = await render(InactiveMerchantDay7Email({ shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, tout va bien ?`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send inactive merchant day 7 email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Inactive merchant day 7 email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending inactive merchant day 7 email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email commerçant inactif J+14 (pression concurrentielle)
export async function sendInactiveMerchantDay14Email(
  to: string,
  shopName: string,
  rewardDescription?: string,
  stampsRequired?: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(InactiveMerchantDay14Email({ shopName, rewardDescription, stampsRequired }));
    const text = await render(InactiveMerchantDay14Email({ shopName, rewardDescription, stampsRequired }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Comment fidéliser vos clients`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send inactive merchant day 14 email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Inactive merchant day 14 email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending inactive merchant day 14 email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email commerçant inactif J+30 (check-in personnel)
export async function sendInactiveMerchantDay30Email(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(InactiveMerchantDay30Email({ shopName }));
    const text = await render(InactiveMerchantDay30Email({ shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, on peut vous aider ?`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send inactive merchant day 30 email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Inactive merchant day 30 email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending inactive merchant day 30 email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email QR code automatique (après configuration du programme)
export async function sendQRCodeEmail(
  to: string,
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(QRCodeEmail({ businessName: shopName }));
    const text = await render(QRCodeEmail({ businessName: shopName }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, votre QR code est prêt`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send QR code email', error);
      return { success: false, error: error.message };
    }

    logger.info(`QR code email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending QR code email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email kit réseaux sociaux (après configuration du programme)
export async function sendSocialKitEmail(
  to: string,
  shopName: string,
  rewardDescription: string,
  stampsRequired: number,
  primaryColor: string,
  logoUrl?: string,
  socialImageUrl?: string,
  tier2Enabled?: boolean,
  tier2StampsRequired?: number | null,
  tier2RewardDescription?: string | null
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const emailProps = {
      shopName,
      rewardDescription,
      stampsRequired,
      primaryColor,
      logoUrl,
      socialImageUrl,
      tier2Enabled,
      tier2StampsRequired,
      tier2RewardDescription,
    };
    const html = await render(SocialKitEmail(emailProps));
    const text = await render(SocialKitEmail(emailProps), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName} — Votre visuel réseaux sociaux est prêt !`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send social kit email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Social kit email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending social kit email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email relance inscription incomplète #2 - PROGRAMMÉ via Resend scheduledAt
export async function scheduleIncompleteSignupReminder2Email(
  to: string,
  delayMinutes: number = 180
): Promise<ScheduleEmailResult> {
  const check = checkResend();
  if (check) return { success: false, error: check.error };

  try {
    const html = await render(IncompleteSignupReminder2Email({ email: to }));
    const text = await render(IncompleteSignupReminder2Email({ email: to }), { plainText: true });

    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    const { data, error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: 'Votre espace Qarte vous attend',
      html,
      text,
      headers: EMAIL_HEADERS,
      scheduledAt,
    });

    if (error) {
      logger.error('Failed to schedule incomplete signup reminder 2 email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Incomplete signup reminder 2 email scheduled for ${to} in ${delayMinutes} minutes (id: ${data?.id})`);
    return { success: true, emailId: data?.id };
  } catch (error) {
    logger.error('Error scheduling incomplete signup reminder 2 email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule email' };
  }
}

// Email premier scan (célébration)
export async function sendFirstScanEmail(
  to: string,
  shopName: string,
  referralCode?: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(FirstScanEmail({ shopName, referralCode }));
    const text = await render(FirstScanEmail({ shopName, referralCode }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, votre 1er client !`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send first scan email', error);
      return { success: false, error: error.message };
    }

    logger.info(`First scan email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending first scan email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email première récompense débloquée
export async function sendFirstRewardEmail(
  to: string,
  shopName: string,
  rewardDescription: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(FirstRewardEmail({ shopName, rewardDescription }));
    const text = await render(FirstRewardEmail({ shopName, rewardDescription }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `1ère récompense débloquée !`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send first reward email', error);
      return { success: false, error: error.message };
    }

    logger.info(`First reward email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending first reward email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
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
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(WeeklyDigestEmail({ shopName, scansThisWeek, newCustomers, rewardsEarned, totalCustomers }));
    const text = await render(WeeklyDigestEmail({ shopName, scansThisWeek, newCustomers, rewardsEarned, totalCustomers }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName} — votre semaine`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send weekly digest email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Weekly digest email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending weekly digest email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email check-in J+5 (comble le gap J+3 → J+7)
export async function sendDay5CheckinEmail(
  to: string,
  shopName: string,
  totalScans: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(Day5CheckinEmail({ shopName, totalScans }));
    const text = await render(Day5CheckinEmail({ shopName, totalScans }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, votre 1ère semaine`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send day 5 checkin email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Day 5 checkin email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending day 5 checkin email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email upsell Tier 2 VIP
export async function sendTier2UpsellEmail(
  to: string,
  shopName: string,
  totalCustomers: number,
  rewardDescription: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(Tier2UpsellEmail({ shopName, totalCustomers, rewardDescription }));
    const text = await render(Tier2UpsellEmail({ shopName, totalCustomers, rewardDescription }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Vos meilleurs clients méritent plus`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send tier 2 upsell email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Tier 2 upsell email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending tier 2 upsell email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email script client J+2 après config programme (0 scans)
export async function sendFirstClientScriptEmail(
  to: string,
  shopName: string,
  shopType: string,
  rewardDescription: string,
  stampsRequired: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(FirstClientScriptEmail({ shopName, shopType, rewardDescription, stampsRequired }));
    const text = await render(FirstClientScriptEmail({ shopName, shopType, rewardDescription, stampsRequired }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `La phrase exacte à dire à vos client(e)s`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send first client script email', error);
      return { success: false, error: error.message };
    }

    logger.info(`First client script email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending first client script email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// Email quick check J+4 après config programme (0 scans)
export async function sendQuickCheckEmail(
  to: string,
  shopName: string,
  daysRemaining: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(QuickCheckEmail({ shopName, daysRemaining }));
    const text = await render(QuickCheckEmail({ shopName, daysRemaining }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName}, une question rapide`,
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      logger.error('Failed to send quick check email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Quick check email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending quick check email', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}
