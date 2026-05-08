/**
 * Alertes admin pour incidents SMS critiques.
 *
 * Pattern aligne sur sendNewMerchantNotification et sendSmsCreditLowEmail :
 * - Email Resend a sales@getqarte.com (channel ops)
 * - Dedup via app_config(key=last_sent_at) pour eviter spam
 *
 * Severites :
 * - critical : config_error, no_credit, batch_audit_high_miss → email immediat
 * - warning  : taux d'echec > 5% sur 1h → email max 1/heure
 *
 * Aucun envoi si RESEND_API_KEY absent (degradation gracieuse).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import logger from './logger';

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = 'Qarte <noreply@getqarte.com>';
const ALERT_TO = 'sales@getqarte.com';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export type SmsAlertKind =
  | 'config_error'
  | 'no_credit_ovh'
  | 'no_credit_sms_partner'
  | 'high_failure_rate'
  | 'batch_audit_high_miss';

const DEDUP_WINDOW_MS: Record<SmsAlertKind, number> = {
  config_error: 30 * 60 * 1000,           // 30 min
  no_credit_ovh: 6 * 60 * 60 * 1000,      // 6h
  no_credit_sms_partner: 6 * 60 * 60 * 1000,
  high_failure_rate: 60 * 60 * 1000,      // 1h
  batch_audit_high_miss: 24 * 60 * 60 * 1000, // 24h (1 alerte/jour max)
};

// Cle app_config par type d'alerte. Defini explicitement (vs template `${kind}`)
// pour avoir une garantie type-check si on renomme un SmsAlertKind.
const DEDUP_KEYS: Record<SmsAlertKind, string> = {
  config_error: 'sms_alert_config_error_last_sent_at',
  no_credit_ovh: 'sms_alert_no_credit_ovh_last_sent_at',
  no_credit_sms_partner: 'sms_alert_no_credit_sms_partner_last_sent_at',
  high_failure_rate: 'sms_alert_high_failure_rate_last_sent_at',
  batch_audit_high_miss: 'sms_alert_batch_audit_last_sent_at',
};

const SUBJECTS: Record<SmsAlertKind, string> = {
  config_error: 'Erreur config SMS critique',
  no_credit_ovh: 'Crédit OVH SMS épuisé',
  no_credit_sms_partner: 'Crédit SMS Partner épuisé',
  high_failure_rate: 'Taux d\'échec SMS élevé',
  batch_audit_high_miss: 'Audit SMS J-1 : rappels manquants détectés',
};

interface AlertContext {
  message: string;
  details?: Record<string, string | number | undefined>;
  cta?: { label: string; url: string };
}

/**
 * Envoie une alerte admin si pas deja envoyee dans la fenetre de dedup.
 * Retourne true si email envoye, false si skip dedup ou erreur.
 */
export async function notifySmsAdmin(
  supabase: SupabaseClient,
  kind: SmsAlertKind,
  ctx: AlertContext,
): Promise<boolean> {
  if (!resend) {
    logger.warn('[sms-admin-alerts] RESEND_API_KEY missing, skipping alert', { kind });
    return false;
  }

  const dedupKey = DEDUP_KEYS[kind];
  const windowMs = DEDUP_WINDOW_MS[kind];

  // Check dedup via app_config (jsonb : { sent_at: ISO })
  const { data: cfg } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', dedupKey)
    .maybeSingle();

  const cfgValue = cfg?.value as { sent_at?: string } | undefined;
  if (cfgValue?.sent_at) {
    const lastSent = new Date(cfgValue.sent_at).getTime();
    if (Date.now() - lastSent < windowMs) {
      logger.info('[sms-admin-alerts] Skip alert (dedup window)', { kind, lastSent: cfgValue.sent_at });
      return false;
    }
  }

  // Build email
  const subject = `[Qarte] ${SUBJECTS[kind]}`;
  const detailsHtml = ctx.details
    ? Object.entries(ctx.details)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `<p><strong>${k} :</strong> ${v}</p>`)
        .join('')
    : '';
  const ctaHtml = ctx.cta
    ? `<p style="margin-top:24px"><a href="${ctx.cta.url}" style="background:#4b0082;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">${ctx.cta.label}</a></p>`
    : '';
  const html = `
    <h2>${SUBJECTS[kind]}</h2>
    <p>${ctx.message}</p>
    ${detailsHtml}
    ${ctaHtml}
    <p style="color:#666;font-size:12px;margin-top:24px">
      Date : ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}<br/>
      Cette alerte ne se repetera pas avant ${Math.round(windowMs / 60000)} min.
    </p>
  `;
  const text = `${SUBJECTS[kind]}\n\n${ctx.message}\n\n${
    ctx.details ? Object.entries(ctx.details).filter(([, v]) => v !== undefined).map(([k, v]) => `${k} : ${v}`).join('\n') : ''
  }${ctx.cta ? `\n\n${ctx.cta.label} : ${ctx.cta.url}` : ''}\n\nDate : ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`;

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ALERT_TO,
      subject,
      html,
      text,
    });

    if (error) {
      logger.error('[sms-admin-alerts] Resend failed', { kind, error });
      return false;
    }

    // Update dedup timestamp (format jsonb { sent_at: ISO })
    await supabase
      .from('app_config')
      .upsert({ key: dedupKey, value: { sent_at: new Date().toISOString() } }, { onConflict: 'key' });

    logger.info('[sms-admin-alerts] Alert sent', { kind, to: ALERT_TO });
    return true;
  } catch (err) {
    logger.error('[sms-admin-alerts] Exception sending alert', { kind, err: String(err) });
    return false;
  }
}
