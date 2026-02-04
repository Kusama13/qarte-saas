import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Adresses centralisées pour éviter les incohérences (anti-spam)
export const EMAIL_FROM = 'Qarte <notifications@getqarte.com>';
export const EMAIL_REPLY_TO = 'support@getqarte.com';

// Headers anti-spam recommandés par Gmail/Outlook
export const EMAIL_HEADERS = {
  'List-Unsubscribe': '<mailto:unsubscribe@getqarte.com?subject=unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
