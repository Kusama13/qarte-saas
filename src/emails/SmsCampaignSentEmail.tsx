import { Button, Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import type { EmailLocale } from './translations';

interface SmsCampaignSentEmailProps {
  shopName: string;
  recipientCount: number;
  smsPerRecipient: number;
  totalSmsSent: number;
  /** SMS deja consommes ce cycle (incluant cette campagne). Quota inclus dans l abonnement. */
  quotaUsed: number;
  /** Quota mensuel inclus (typiquement 100 pour all_in). */
  quotaTotal: number;
  /** Solde du pack SMS achete en plus (0 si pas de pack). */
  packBalance: number;
  body: string;
  bodyWasNormalized?: boolean;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

export function SmsCampaignSentEmail({
  shopName,
  recipientCount,
  smsPerRecipient,
  totalSmsSent,
  quotaUsed,
  quotaTotal,
  packBalance,
  body,
  bodyWasNormalized = false,
  dashboardUrl = 'https://getqarte.com/dashboard/marketing?tab=sms',
  locale = 'fr',
}: SmsCampaignSentEmailProps) {
  const isEn = locale === 'en';

  const preview = isEn
    ? `Your SMS campaign reached ${recipientCount} clients`
    : `Ta campagne SMS a touché ${recipientCount} clientes`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'Campaign delivered ✅' : 'Campagne envoyée ✅'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${shopName}, your SMS campaign just went out.`
          : `Hello ${shopName}, ta campagne SMS vient de partir.`}
      </Text>

      <Section style={statsBox}>
        <Text style={statRow}>
          <strong>{isEn ? 'Recipients:' : 'Destinataires :'}</strong> {recipientCount}
        </Text>
        <Text style={statRow}>
          <strong>{isEn ? 'SMS per recipient:' : 'SMS par destinataire :'}</strong> {smsPerRecipient}
        </Text>
        <Text style={statRow}>
          <strong>{isEn ? 'Total SMS sent:' : 'Total SMS envoyés :'}</strong> {totalSmsSent}
        </Text>
      </Section>

      <Section style={quotaBox}>
        <Text style={quotaLabel}>
          {isEn ? 'YOUR MONTHLY QUOTA' : 'TON QUOTA MENSUEL'}
        </Text>
        <Text style={quotaMain}>
          {quotaUsed} / {quotaTotal} {isEn ? 'SMS used this cycle' : 'SMS utilisés ce cycle'}
        </Text>
        {packBalance > 0 && (
          <Text style={quotaSecondary}>
            + {packBalance} {isEn ? 'SMS available in your pack' : 'SMS dispo dans ton pack'}
          </Text>
        )}
        <Text style={quotaNote}>
          {isEn
            ? 'Included in your subscription — no extra charge for this campaign.'
            : 'Inclus dans ton abonnement — aucun frais supplémentaire pour cette campagne.'}
        </Text>
      </Section>

      <Section style={messageBox}>
        <Text style={messageLabel}>
          {isEn ? 'Message sent:' : 'Message envoyé :'}
        </Text>
        <Text style={messageBody}>{body}</Text>
      </Section>

      {bodyWasNormalized && (
        <Section style={infoBox}>
          <Text style={infoText}>
            {isEn
              ? 'Note: emojis and special characters were removed before sending to keep your campaign at 1 SMS per recipient (otherwise operators bill double). The wording is identical.'
              : 'Note : les emojis et caractères spéciaux ont été retirés avant envoi pour garder ta campagne à 1 SMS par destinataire (sinon les opérateurs facturent en double). Le texte reste identique.'}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          {isEn ? 'View campaign stats' : 'Voir les stats'}
        </Button>
      </Section>

      <Text style={tip}>
        {isEn
          ? 'Tip: track replies and bookings in the next 48 h — that\'s when most clients react.'
          : 'Astuce : surveille les retours et résas dans les 48 h — c\'est là que la majorité des clientes réagissent.'}
      </Text>

      <EmailSignoff>{isEn ? 'The Qarte team 💜' : "L'équipe Qarte 💜"}</EmailSignoff>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const statsBox = {
  backgroundColor: '#F0FDF4',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #BBF7D0',
};

const statRow = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 6px 0',
};

const quotaBox = {
  backgroundColor: '#FAF5FF',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
  border: '1px solid #E9D5FF',
};

const quotaLabel = {
  color: '#7E22CE',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 6px 0',
};

const quotaMain = {
  color: '#1F2937',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 4px 0',
};

const quotaSecondary = {
  color: '#6B21A8',
  fontSize: '13px',
  fontWeight: '500',
  lineHeight: '1.4',
  margin: '0 0 6px 0',
};

const quotaNote = {
  color: '#7E22CE',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  lineHeight: '1.4',
  margin: '4px 0 0 0',
};

const messageBox = {
  backgroundColor: '#F8FAFC',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 16px 0',
  border: '1px solid #E2E8F0',
};

const messageLabel = {
  color: '#64748B',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const messageBody = {
  color: '#1F2937',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
  fontFamily: 'monospace',
};

const infoBox = {
  backgroundColor: '#FEF7E0',
  borderRadius: '12px',
  padding: '14px 18px',
  margin: '0 0 24px 0',
  border: '1px solid #FCD34D',
};

const infoText = {
  color: '#78350F',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#4b0082',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const tip = {
  color: '#6B7280',
  fontSize: '13px',
  lineHeight: '1.5',
  fontStyle: 'italic' as const,
  margin: '8px 0 0 0',
  textAlign: 'center' as const,
};

export default SmsCampaignSentEmail;
