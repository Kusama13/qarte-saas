import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface VitrineReminderEmailProps {
  shopName: string;
  daysRemaining: number;
  locale?: EmailLocale;
}

export function VitrineReminderEmail({ shopName, daysRemaining, locale = 'fr' }: VitrineReminderEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('vitrineReminder.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('vitrineReminder.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('vitrineReminder.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('vitrineReminder.intro')}
      </Text>

      <Section style={featureBox}>
        <Text style={featureTitle}>{t('vitrineReminder.featureTitle')}</Text>
        <Text style={featureDesc}>{t('vitrineReminder.featureDesc')}</Text>
      </Section>

      <Section style={urgencyBox}>
        <Text style={urgencyText} dangerouslySetInnerHTML={{ __html: t('vitrineReminder.trialNote', { daysRemaining, daysPlural: daysRemaining > 1 ? 's' : '' }) }} />
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/public-page">
          {t('vitrineReminder.cta')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('vitrineReminder.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const featureBox = {
  backgroundColor: '#f0f4ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 16px 0',
  border: '1px solid #e0e7ff',
};

const featureTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const featureDesc = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const urgencyBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const urgencyText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0 0 0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default VitrineReminderEmail;
