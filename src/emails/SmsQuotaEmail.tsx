import { Button, Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SmsQuotaEmailProps {
  shopName: string;
  level: '90' | '100';
  ctaUrl: string;
  locale?: EmailLocale;
}

export function SmsQuotaEmail({ shopName, level, ctaUrl, locale = 'fr' }: SmsQuotaEmailProps) {
  const t = getEmailT(locale);
  const isBlocked = level === '100';
  const prefix = isBlocked ? 'smsQuotaReached' : 'smsQuotaWarning';

  return (
    <BaseLayout preview={t(`${prefix}.preview`, { shopName })} locale={locale}>
      <Heading style={heading}>{t(`${prefix}.heading`)}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t(`${prefix}.greeting`, { shopName }) }} />

      <Text style={paragraph}>{t(`${prefix}.intro`)}</Text>

      <Section style={isBlocked ? alertBox : warningBox}>
        <Text style={isBlocked ? alertTitle : warningTitle}>
          {t(`${prefix}.statusTitle`)}
        </Text>
        <Text style={isBlocked ? alertText : warningText}>
          {t(`${prefix}.statusBody`)}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={ctaUrl}>
          {t(`${prefix}.cta`)}
        </Button>
      </Section>

      <Text style={footerNote}>{t(`${prefix}.footer`)}</Text>

      <Text style={signature}>{t(`${prefix}.signature`)}</Text>
    </BaseLayout>
  );
}

const heading = { color: '#1a1a1a', fontSize: '26px', fontWeight: '700', lineHeight: '1.3', margin: '0 0 24px 0' };
const paragraph = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px 0' };
const warningBox = { backgroundColor: '#fef3c7', borderRadius: '12px', padding: '20px 24px', margin: '24px 0', border: '2px solid #fcd34d' };
const warningTitle = { color: '#92400e', fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' };
const warningText = { color: '#78350f', fontSize: '14px', lineHeight: '1.6', margin: '0' };
const alertBox = { backgroundColor: '#fee2e2', borderRadius: '12px', padding: '20px 24px', margin: '24px 0', border: '2px solid #fca5a5' };
const alertTitle = { color: '#991b1b', fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' };
const alertText = { color: '#7f1d1d', fontSize: '14px', lineHeight: '1.6', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = {
  backgroundColor: '#4b0082', borderRadius: '10px', color: '#ffffff',
  fontSize: '16px', fontWeight: '700', textDecoration: 'none',
  padding: '14px 28px', display: 'inline-block',
};
const footerNote = { color: '#6b7280', fontSize: '13px', lineHeight: '1.6', margin: '24px 0 8px 0' };
const signature = { color: '#4a5568', fontSize: '15px', margin: '24px 0 0 0', fontStyle: 'italic' as const };
