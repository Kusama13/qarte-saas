import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import { getEmailT, type EmailLocale } from './translations';

interface SubscriptionForceCanceledEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function SubscriptionForceCanceledEmail({ shopName, locale = 'fr' }: SubscriptionForceCanceledEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('subscriptionForceCanceled.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('subscriptionForceCanceled.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('subscriptionForceCanceled.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('subscriptionForceCanceled.intro')}
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>{t('subscriptionForceCanceled.whatHappenedTitle')}</Text>
        <Text style={infoText}>
          {t('subscriptionForceCanceled.whatHappenedText')}
        </Text>
      </Section>

      <Section style={dataSection}>
        <Text style={dataTitle}>{t('subscriptionForceCanceled.dataTitle')}</Text>
        <Text style={dataText}>
          {t('subscriptionForceCanceled.dataRetention')}
        </Text>
        <Text style={dataText}>
          {t('subscriptionForceCanceled.dataContact')}
        </Text>
      </Section>

      <Section style={offerBox}>
        <Text style={offerTitle}>{t('subscriptionForceCanceled.comeBackTitle')}</Text>
        <Text style={offerText}>
          {t('subscriptionForceCanceled.comeBackText')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('subscriptionForceCanceled.ctaReactivate')}
        </Button>
      </Section>

      <Text style={helpText}>
        {t('subscriptionForceCanceled.helpText')}
      </Text>

      <EmailSignoff prefix={t('subscriptionForceCanceled.signaturePrefix')}>{t('subscriptionForceCanceled.signature')}</EmailSignoff>
    </BaseLayout>
  );
}

const heading = {
  color: '#991b1b',
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

const infoBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #fecaca',
};

const infoTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#7f1d1d',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const dataSection = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const dataTitle = {
  color: '#7c3aed',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const dataText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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

const offerBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const offerTitle = {
  color: '#4b0082',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const offerText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const helpText = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0',
  fontStyle: 'italic' as const,
};

export default SubscriptionForceCanceledEmail;
