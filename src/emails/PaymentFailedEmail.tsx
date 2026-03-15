import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface PaymentFailedEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function PaymentFailedEmail({ shopName, locale = 'fr' }: PaymentFailedEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('paymentFailed.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('paymentFailed.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('paymentFailed.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('paymentFailed.intro')}
      </Text>

      <Section style={warningBox}>
        <Text style={warningTitle}>{t('paymentFailed.whyTitle')}</Text>
        <Text style={warningText}>
          {t('paymentFailed.whyText')}
        </Text>
      </Section>

      <Section style={impactSection}>
        <Text style={impactTitle}>{t('paymentFailed.impactTitle')}</Text>
        <Text style={impactItem}>{t('paymentFailed.impact1')}</Text>
        <Text style={impactItem}>{t('paymentFailed.impact2')}</Text>
        <Text style={impactItem}>{t('paymentFailed.impact3')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('paymentFailed.ctaUpdate')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('paymentFailed.helpText')}
      </Text>

      <Text style={signature}>
        {t('paymentFailed.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#f59e0b',
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

const warningBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #fde68a',
};

const warningTitle = {
  color: '#b45309',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const warningText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const impactSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const impactTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const impactItem = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#f59e0b',
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

export default PaymentFailedEmail;
