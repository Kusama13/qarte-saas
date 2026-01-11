import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const EMAIL_FROM = 'Qarte <noreply@getqarte.com>';
export const EMAIL_REPLY_TO = 'support@getqarte.com';
