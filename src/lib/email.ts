import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from './resend';
import { render } from '@react-email/render';
import {
  WelcomeEmail,
  TrialEndingEmail,
  TrialExpiredEmail,
  SubscriptionConfirmedEmail,
  PendingPointsEmail,
} from '@/emails';
import logger from './logger';

function checkResend() {
  if (!resend) {
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

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `Bienvenue sur Qarte, ${shopName} !`,
      html,
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
      ? `⏰ Dernier jour d'essai, ${shopName} !`
      : `Votre essai Qarte se termine dans ${daysRemaining} jours`;

    const html = await render(TrialEndingEmail({ shopName, daysRemaining }));

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
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

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: `⚠️ Urgent : Vos données seront supprimées dans ${daysUntilDeletion} jours`,
      html,
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
    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to: 'sales@getqarte.com',
      subject: `🎉 Nouveau commerçant : ${shopName}`,
      html: `
        <h2>Nouveau commerçant inscrit sur Qarte !</h2>
        <p><strong>Commerce :</strong> ${shopName}</p>
        <p><strong>Type :</strong> ${shopType}</p>
        <p><strong>Adresse :</strong> ${shopAddress}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
      `,
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

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject: '🎉 Votre abonnement Qarte est activé !',
      html,
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
      ? `📋 Rappel : ${pendingCount} point${pendingCount > 1 ? 's' : ''} en attente de validation`
      : `🛡️ Qarte Shield : ${pendingCount} point${pendingCount > 1 ? 's' : ''} à modérer`;

    const html = await render(
      PendingPointsEmail({
        shopName,
        pendingCount,
        isReminder,
        daysSinceFirst,
      })
    );

    const { error } = await resend!.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
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
