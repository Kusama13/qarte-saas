import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from './resend';

function checkResend() {
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  return null;
}
import {
  WelcomeEmail,
  TrialEndingEmail,
  TrialExpiredEmail,
  SubscriptionConfirmedEmail,
} from '@/emails';
import logger from './logger';

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
    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Bienvenue sur Qarte, ${shopName} !`,
      react: WelcomeEmail({ shopName }),
    });

    if (error) {
      logger.error('Failed to send welcome email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending welcome email', error);
    return { success: false, error: 'Failed to send email' };
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
      ? `⏰ Dernier jour d'essai, ${shopName} !`
      : `Votre essai Qarte se termine dans ${daysRemaining} jours`;

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      react: TrialEndingEmail({ shopName, daysRemaining }),
    });

    if (error) {
      logger.error('Failed to send trial ending email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Trial ending email sent to ${to} (${daysRemaining} days)`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending trial ending email', error);
    return { success: false, error: 'Failed to send email' };
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
    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `⚠️ Urgent : Vos données seront supprimées dans ${daysUntilDeletion} jours`,
      react: TrialExpiredEmail({ shopName, daysUntilDeletion }),
    });

    if (error) {
      logger.error('Failed to send trial expired email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Trial expired email sent to ${to} (${daysUntilDeletion} days until deletion)`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending trial expired email', error);
    return { success: false, error: 'Failed to send email' };
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
    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: '🎉 Votre abonnement Qarte est activé !',
      react: SubscriptionConfirmedEmail({ shopName }),
    });

    if (error) {
      logger.error('Failed to send subscription confirmed email', error);
      return { success: false, error: error.message };
    }

    logger.info(`Subscription confirmed email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending subscription confirmed email', error);
    return { success: false, error: 'Failed to send email' };
  }
}
