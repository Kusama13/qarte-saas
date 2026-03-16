import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface IncompleteSignupReminder2EmailProps {
  email: string;
  locale?: EmailLocale;
}

export function IncompleteSignupReminder2Email({ email, locale = 'fr' }: IncompleteSignupReminder2EmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('incompleteSignup2.preview')} locale={locale}>
      <Heading style={heading}>
        {t('incompleteSignup2.heading')}
      </Heading>

      <Text style={paragraph}>
        {t('incompleteSignup2.greeting')}
      </Text>

      <Text style={paragraph}>
        {t('incompleteSignup2.body1')}
      </Text>

      <Text style={highlightBox} dangerouslySetInnerHTML={{ __html: t('incompleteSignup2.highlightBox') }} />

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          {t('incompleteSignup2.cta')}
        </Button>
      </Section>

      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>
          {t('incompleteSignup2.testimonialQuote')}
        </Text>
        <Text style={testimonialAuthor}>
          {t('incompleteSignup2.testimonialAuthor')}
        </Text>
      </Section>

      <Text style={paragraph}>
        {t('incompleteSignup2.helpLine')}
      </Text>

      <Text style={signature}>
        {t('incompleteSignup2.signaturePrefix')}
        <br />
        {t('incompleteSignup2.signature')}
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

const highlightBox = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.6',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px 0',
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

const testimonialBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
  borderLeft: '4px solid #4b0082',
};

const testimonialQuote = {
  color: '#4a5568',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const testimonialAuthor = {
  color: '#718096',
  fontSize: '13px',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default IncompleteSignupReminder2Email;
