import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Adresses centralisées pour éviter les incohérences (anti-spam)
export const EMAIL_FROM = 'Qarte <notifications@getqarte.com>';
export const EMAIL_REPLY_TO = 'support@getqarte.com';

// Header List-Unsubscribe (RFC 2369)
// Note: List-Unsubscribe-Post (one-click) nécessite une URL HTTPS — à ajouter quand endpoint dispo
export const EMAIL_HEADERS = {
  'List-Unsubscribe': '<mailto:contact@getqarte.com?subject=Desinscription>',
};
