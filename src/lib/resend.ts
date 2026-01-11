import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = 'Qarte <noreply@getqarte.com>';
export const EMAIL_REPLY_TO = 'support@getqarte.com';
