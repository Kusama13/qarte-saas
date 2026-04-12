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

interface WelcomeEmailProps {
  shopName: string;
  slug?: string;
  trialDays?: number;
  locale?: EmailLocale;
}

export function WelcomeEmail({ shopName, trialDays = 7, locale = 'fr' }: WelcomeEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('welcome.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('welcome.heading', { shopName })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('welcome.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('welcome.intro') }} />

      {/* What changes for you */}
      <Section style={benefitsBox}>
        <Text style={sectionTitle}>{t('welcome.benefitsTitle')}</Text>
        <Text style={benefitItem} dangerouslySetInnerHTML={{ __html: `&#x2713; ${t('welcome.benefit1')}` }} />
        <Text style={benefitItem} dangerouslySetInnerHTML={{ __html: `&#x2713; ${t('welcome.benefit2')}` }} />
        <Text style={benefitItem} dangerouslySetInnerHTML={{ __html: `&#x2713; ${t('welcome.benefit3')}` }} />
      </Section>

      {/* SMS unlock */}
      <Section style={smsBox}>
        <Text style={smsTitle}>{t('welcome.smsTitle')}</Text>
        <Text style={smsItem}>&#x2713; {t('welcome.sms1')}</Text>
        <Text style={smsItem}>&#x2713; {t('welcome.sms2')}</Text>
        <Text style={smsItem}>&#x2713; {t('welcome.sms3')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          {t('welcome.ctaPersonalize')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Section style={pwaBox}>
        <Text style={pwaTitle}>{t('welcome.pwaTitle')}</Text>
        <Text style={pwaText} dangerouslySetInnerHTML={{ __html: t('welcome.pwaText') }} />
      </Section>

      <Hr style={divider} />

      <Text style={footerNote}>
        {t('welcome.trialNote', { trialDays: String(trialDays) })}
      </Text>

      <Text style={paragraph}>
        {t('welcome.helpText')}
      </Text>

      <Text style={signature}>
        {t('welcome.signature')}
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

const sectionTitle = {
  color: '#1a1a1a',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const benefitsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #4b0082',
};

const benefitItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const smsBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '16px 0 0 0',
  borderLeft: '4px solid #10b981',
};

const smsTitle = {
  color: '#065f46',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 10px 0',
};

const smsItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0 0 0',
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

const buttonSecondary = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const pwaBox = {
  backgroundColor: '#f0f4ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
  border: '1px solid #e0e7ff',
};

const pwaTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const pwaText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const footerNote = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default WelcomeEmail;
