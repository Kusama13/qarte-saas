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
  SocialKitEmail,
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
      subject: `Bienvenue sur Qarte, ${shopName}`,
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
  daysRemaining: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const subject = daysRemaining <= 1
      ? `${shopName} - Dernier jour de votre essai Qarte`
      : `${shopName} - Votre essai Qarte se termine dans ${daysRemaining} jours`;

    const html = await render(TrialEndingEmail({ shopName, daysRemaining }));
    const text = await render(TrialEndingEmail({ shopName, daysRemaining }), { plainText: true });

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
  daysUntilDeletion: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(TrialExpiredEmail({ shopName, daysUntilDeletion }));
    const text = await render(TrialExpiredEmail({ shopName, daysUntilDeletion }), { plainText: true });

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `${shopName} - Action requise : votre compte expire dans ${daysUntilDeletion} jours`,
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
  shopName: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(SubscriptionConfirmedEmail({ shopName }));
    const text = await render(SubscriptionConfirmedEmail({ shopName }), { plainText: true });

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
      subject: `${shopName} - Action requise : problème de paiement`,
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
      subject: 'Votre compte Qarte est presque prêt — il ne reste que 30 secondes',
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
      subject: `${shopName}, vos clientes d'aujourd'hui repartent sans carte de fidélité`,
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
  totalCustomers?: number
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(ReactivationEmail({ shopName, daysSinceCancellation, totalCustomers }));
    const text = await render(ReactivationEmail({ shopName, daysSinceCancellation, totalCustomers }), { plainText: true });

    // Sujets différenciés selon le timing
    let subject: string;
    if (daysSinceCancellation <= 7) {
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
      subject: `${shopName} - Quelle récompense choisir ? On a la réponse`,
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
      subject: `${shopName} - Dernier rappel : vos jours d'essai passent vite`,
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
      subject: `${shopName} - Aucun passage depuis 7 jours, tout va bien ?`,
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
      subject: `${shopName} - Comment vos concurrents fidélisent leurs clients`,
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
      subject: `${shopName} - Un mois sans utiliser Qarte : on peut vous aider ?`,
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

// Email kit réseaux sociaux (après configuration du programme)
export async function sendSocialKitEmail(
  to: string,
  shopName: string,
  rewardDescription: string,
  stampsRequired: number,
  primaryColor: string,
  logoUrl?: string,
  socialImageUrl?: string
): Promise<SendEmailResult> {
  const check = checkResend();
  if (check) return check;

  try {
    const html = await render(
      SocialKitEmail({
        shopName,
        rewardDescription,
        stampsRequired,
        primaryColor,
        logoUrl,
        socialImageUrl,
      })
    );
    const text = await render(
      SocialKitEmail({
        shopName,
        rewardDescription,
        stampsRequired,
        primaryColor,
        logoUrl,
        socialImageUrl,
      }),
      { plainText: true }
    );

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
