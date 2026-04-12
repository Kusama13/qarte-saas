import { Resend } from 'resend';
import crypto from 'crypto';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Adresses centralisées pour éviter les incohérences (anti-spam)
export const EMAIL_FROM = 'Qarte <notifications@getqarte.com>';
export const EMAIL_REPLY_TO = 'support@getqarte.com';

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? 'https://getqarte.com'
  : 'http://localhost:3000';

// Generate HMAC-based unsubscribe token for a merchant
export function generateUnsubscribeToken(merchantId: string): string {
  const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret';
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${merchantId}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 16);
  return `${payload}.${signature}`;
}

// Default headers (fallback for emails without merchant context)
export const EMAIL_HEADERS: Record<string, string> = {
  'List-Unsubscribe': '<mailto:contact@getqarte.com?subject=Desinscription>',
};

// Per-merchant headers with one-click unsubscribe (RFC 8058)
export function getEmailHeaders(merchantId?: string): Record<string, string> {
  if (!merchantId) return EMAIL_HEADERS;

  const token = generateUnsubscribeToken(merchantId);
  const unsubUrl = `${BASE_URL}/api/email/unsubscribe?token=${token}`;

  return {
    'List-Unsubscribe': `<${unsubUrl}>, <mailto:contact@getqarte.com?subject=Desinscription>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
