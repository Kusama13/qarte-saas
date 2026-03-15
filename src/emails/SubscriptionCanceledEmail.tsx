import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SubscriptionCanceledEmailProps {
  shopName: string;
  endDate?: string;
  locale?: EmailLocale;
}

export function SubscriptionCanceledEmail({ shopName, endDate, locale = 'fr' }: SubscriptionCanceledEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('subscriptionCanceled.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('subscriptionCanceled.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('subscriptionCanceled.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('subscriptionCanceled.intro')}
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>{t('subscriptionCanceled.summaryTitle')}</Text>
        <Text style={infoText} dangerouslySetInnerHTML={{ __html: endDate
          ? t('subscriptionCanceled.accessEndDate', { endDate })
          : t('subscriptionCanceled.accessEndCurrent')
        }} />
        <Text style={infoText}>
          {t('subscriptionCanceled.afterEndDate')}
        </Text>
      </Section>

      <Section style={dataSection}>
        <Text style={dataTitle}>{t('subscriptionCanceled.dataTitle')}</Text>
        <Text style={dataText}>
          {t('subscriptionCanceled.dataRetention')}
        </Text>
        <Text style={dataText}>
          {t('subscriptionCanceled.dataContact')}
        </Text>
      </Section>

      <Section style={offerBox}>
        <Text style={offerTitle}>{t('subscriptionCanceled.comeBackTitle')}</Text>
        <Text style={offerText}>
          {t('subscriptionCanceled.comeBackText')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('subscriptionCanceled.ctaReactivate')}
        </Button>
      </Section>

      <Text style={feedbackTextStyle}>
        {t('subscriptionCanceled.feedbackText')}
      </Text>

      <Text style={signature}>
        {t('subscriptionCanceled.signaturePrefix')}
        <br />
        {t('subscriptionCanceled.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#6b7280',
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
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const infoTitle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
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

const feedbackTextStyle = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0',
  fontStyle: 'italic' as const,
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default SubscriptionCanceledEmail;
