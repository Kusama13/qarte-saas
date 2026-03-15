import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface GuidedSignupEmailProps {
  email: string;
  locale?: EmailLocale;
}

export function GuidedSignupEmail({ email, locale = 'fr' }: GuidedSignupEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('guidedSignup.preview')} locale={locale}>
      <Heading style={heading}>
        {t('guidedSignup.heading')}
      </Heading>

      <Text style={paragraph}>
        {t('guidedSignup.intro')}
      </Text>

      <Section style={stepsBox}>
        <Text style={stepItem}><strong>1.</strong> {t('guidedSignup.step1')}</Text>
        <Text style={stepItem}><strong>2.</strong> {t('guidedSignup.step2')}</Text>
        <Text style={stepItem}><strong>3.</strong> {t('guidedSignup.step3')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          {t('guidedSignup.ctaSignup')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('guidedSignup.signature')}
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
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

const stepsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '2',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default GuidedSignupEmail;
