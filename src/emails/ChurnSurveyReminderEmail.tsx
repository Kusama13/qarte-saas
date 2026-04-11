import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ChurnSurveyReminderEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function ChurnSurveyReminderEmail({ shopName, locale = 'fr' }: ChurnSurveyReminderEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('churnSurveyReminder.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('churnSurveyReminder.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('churnSurveyReminder.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('churnSurveyReminder.intro') }} />

      <Section style={offerBox}>
        <Text style={offerBadge}>{t('churnSurveyReminder.offerBadge')}</Text>
        <Text style={offerTitle}>{t('churnSurveyReminder.offerTitle')}</Text>
        <Text style={offerText}>
          {t('churnSurveyReminder.offerText')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/survey">
          {t('churnSurveyReminder.cta')}
        </Button>
      </Section>

      <Text style={noteText}>
        {t('churnSurveyReminder.duration')}
      </Text>

      <Text style={paragraph}>
        {t('churnSurveyReminder.questionText')}
      </Text>

      <Text style={signature}>
        {t('churnSurveyReminder.signaturePrefix')}
        <br />
        {t('churnSurveyReminder.signature')}
      </Text>
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

const offerBox = {
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  borderRadius: '12px',
  padding: '24px',
  margin: '28px 0',
  textAlign: 'center' as const,
};

const offerBadge = {
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
  opacity: 0.85,
};

const offerTitle = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 12px 0',
};

const offerText = {
  color: '#ffffff',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  opacity: 0.92,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0 16px 0',
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

const noteText = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ChurnSurveyReminderEmail;
