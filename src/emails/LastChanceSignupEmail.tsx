import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface LastChanceSignupEmailProps {
  email: string;
  locale?: EmailLocale;
}

export function LastChanceSignupEmail({ email, locale = 'fr' }: LastChanceSignupEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('lastChanceSignup.preview')} locale={locale}>
      <Heading style={heading}>
        {t('lastChanceSignup.heading')}
      </Heading>

      <Text style={paragraph}>
        {t('lastChanceSignup.greeting')}
      </Text>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('lastChanceSignup.body1', { email }) }} />

      <Section style={infoBox}>
        <Text style={infoText} dangerouslySetInnerHTML={{ __html: t('lastChanceSignup.warningBox') }} />
      </Section>

      <Hr style={divider} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('lastChanceSignup.body2') }} />

      <Section style={promoBox}>
        <Text style={promoTitle}>{t('lastChanceSignup.promoTitle')}</Text>
        <Text style={promoText} dangerouslySetInnerHTML={{ __html: t('lastChanceSignup.promoText') }} />
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          {t('lastChanceSignup.cta')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('lastChanceSignup.helpLine')}
      </Text>

      <Text style={signature}>
        {t('lastChanceSignup.signature')}
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

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const infoText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const promoBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 8px 0',
  border: '2px solid #f59e0b',
  textAlign: 'center' as const,
};

const promoTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const promoText = {
  color: '#78350f',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
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

export default LastChanceSignupEmail;
