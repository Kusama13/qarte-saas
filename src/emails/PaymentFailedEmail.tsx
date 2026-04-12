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
  step?: 1 | 2 | 3 | 4;
  locale?: EmailLocale;
}

export function PaymentFailedEmail({ shopName, step = 1, locale = 'fr' }: PaymentFailedEmailProps) {
  const t = getEmailT(locale);
  const stepKey = `paymentFailed.step${step}` as const;

  return (
    <BaseLayout preview={t(`${stepKey}.preview` as any, { shopName })} locale={locale}>
      <Heading style={step >= 3 ? headingUrgent : heading}>
        {t(`${stepKey}.heading` as any)}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t(`${stepKey}.greeting` as any, { shopName }) }} />

      <Text style={paragraph}>
        {t(`${stepKey}.intro` as any)}
      </Text>

      {step === 1 && (
        <Section style={warningBox}>
          <Text style={warningTitle}>{t('paymentFailed.step1.whyTitle')}</Text>
          <Text style={warningText}>{t('paymentFailed.step1.whyText')}</Text>
        </Section>
      )}

      {step >= 3 && (
        <Section style={urgentBox}>
          <Text style={urgentText}>{t(`${stepKey}.urgentText` as any)}</Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={step >= 3 ? buttonUrgent : button} href="https://getqarte.com/dashboard/subscription">
          {t(`${stepKey}.cta` as any)}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t(`${stepKey}.helpText` as any)}
      </Text>

      <Text style={signature}>
        {t('paymentFailed.step1.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#f59e0b',
  fontSize: '24px',
  fontWeight: '600' as const,
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const headingUrgent = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: '700' as const,
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
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const buttonUrgent = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '2px solid #fecaca',
};

const urgentText = {
  color: '#991b1b',
  fontSize: '15px',
  lineHeight: '1.6',
  fontWeight: '600' as const,
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default PaymentFailedEmail;
