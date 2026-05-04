export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { getOvhCredit } from '@/lib/ovh-sms';
import { getSmsPartnerCredit } from '@/lib/sms-partner';
import { sendSmsCreditLowEmail } from '@/lib/email';
import { SMS_CREDIT_LOW_THRESHOLD, SMS_CREDIT_RESET_THRESHOLD } from '@/lib/sms-constants';
import type { SmsProvider } from '@/lib/sms';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ALERT_KEYS: Record<SmsProvider, string> = {
  ovh: 'sms_credit_alert_ovh_last_sent_at',
  sms_partner: 'sms_credit_alert_partner_last_sent_at',
};

async function getAlertFlag(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  const v = data?.value as { sent_at?: string } | undefined;
  return v?.sent_at ?? null;
}

async function setAlertFlag(key: string, sentAt: string | null): Promise<void> {
  await supabase
    .from('app_config')
    .upsert({ key, value: sentAt ? { sent_at: sentAt } : {} }, { onConflict: 'key' });
}

async function checkProvider(
  provider: SmsProvider,
  credits: number | null,
): Promise<{ provider: SmsProvider; credits: number | null; alerted: boolean; reason: string }> {
  if (credits === null) {
    return { provider, credits, alerted: false, reason: 'unavailable' };
  }
  const flagKey = ALERT_KEYS[provider];
  const lastAlertAt = await getAlertFlag(flagKey);

  // Reset auto si crédit remonté au-dessus du seuil de reset (anti-spam alerte)
  if (credits >= SMS_CREDIT_RESET_THRESHOLD && lastAlertAt) {
    await setAlertFlag(flagKey, null);
    return { provider, credits, alerted: false, reason: 'reset_above_threshold' };
  }

  if (credits >= SMS_CREDIT_LOW_THRESHOLD) {
    return { provider, credits, alerted: false, reason: 'above_threshold' };
  }

  if (lastAlertAt) {
    return { provider, credits, alerted: false, reason: 'already_alerted' };
  }

  const result = await sendSmsCreditLowEmail({ provider, creditsLeft: credits, threshold: SMS_CREDIT_LOW_THRESHOLD });
  if (result.success) {
    await setAlertFlag(flagKey, new Date().toISOString());
    return { provider, credits, alerted: true, reason: 'alert_sent' };
  }
  return { provider, credits, alerted: false, reason: `email_failed: ${result.error || 'unknown'}` };
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [ovh, partner] = await Promise.all([getOvhCredit(), getSmsPartnerCredit()]);
    const results = await Promise.all([
      checkProvider('ovh', ovh),
      checkProvider('sms_partner', partner),
    ]);
    logger.info('sms_credits_check', { results });
    return NextResponse.json({ ok: true, threshold: SMS_CREDIT_LOW_THRESHOLD, resetThreshold: SMS_CREDIT_RESET_THRESHOLD, results });
  } catch (err) {
    logger.error('sms_credits_check error', err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
