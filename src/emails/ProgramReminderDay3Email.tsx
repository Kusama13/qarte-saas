import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ProgramReminderDay3EmailProps {
  shopName: string;
  daysRemaining: number;
  locale?: EmailLocale;
}

export function ProgramReminderDay3Email({ shopName, daysRemaining, locale = 'fr' }: ProgramReminderDay3EmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('programReminderDay3.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('programReminderDay3.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('programReminderDay3.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('programReminderDay3.intro')}
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText} dangerouslySetInnerHTML={{ __html: t('programReminderDay3.trialNote', { daysRemaining, daysPlural: daysRemaining > 1 ? 's' : '' }) }} />
      </Section>

      <Section style={optionBox}>
        <Text style={optionLabel}>{t('programReminderDay3.offerTitle')}</Text>
        <Text style={optionDescription}>
          {t('programReminderDay3.offerText')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          {t('programReminderDay3.ctaSetup')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('programReminderDay3.signature')}
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

const optionBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 16px 0',
};

const optionLabel = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const optionDescription = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
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

export default ProgramReminderDay3Email;
