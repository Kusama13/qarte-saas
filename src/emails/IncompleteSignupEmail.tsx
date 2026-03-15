import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface IncompleteSignupEmailProps {
  email: string;
  locale?: EmailLocale;
}

export function IncompleteSignupEmail({ email, locale = 'fr' }: IncompleteSignupEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('incompleteSignup.preview')} locale={locale}>
      <Heading style={heading}>
        {t('incompleteSignup.heading')}
      </Heading>

      <Text style={paragraph}>
        {t('incompleteSignup.intro')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          {t('incompleteSignup.ctaFinish')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('incompleteSignup.helpText')}
      </Text>

      <Text style={signature}>
        {t('incompleteSignup.signature')}
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default IncompleteSignupEmail;
