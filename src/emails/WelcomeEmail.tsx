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

export function WelcomeEmail({ shopName, slug, trialDays = 7, locale = 'fr' }: WelcomeEmailProps) {
  const t = getEmailT(locale);
  const publicPageUrl = slug ? `https://getqarte.com/p/${slug}` : null;

  return (
    <BaseLayout preview={t('welcome.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('welcome.heading', { shopName })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('welcome.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('welcome.intro') }} />

      <Text style={subheading}>
        {t('welcome.readyTitle')}
      </Text>

      <Section style={stepsBox}>
        <Text style={stepItem} dangerouslySetInnerHTML={{ __html: t('welcome.stepPagePro') }} />
        <Text style={stepItem} dangerouslySetInnerHTML={{ __html: t('welcome.stepPlanning') }} />
        <Text style={stepItem} dangerouslySetInnerHTML={{ __html: t('welcome.stepLoyalty') }} />
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/personalize">
          {t('welcome.ctaPersonalize')}
        </Button>
      </Section>

      {publicPageUrl && (
        <>
          <Hr style={divider} />

          <Text style={subheading}>
            {t('welcome.publicPageTitle')}
          </Text>

          <Text style={paragraph}>
            {t('welcome.publicPageText')}
          </Text>

          <Section style={buttonContainer}>
            <Button style={buttonSecondary} href={publicPageUrl}>
              {t('welcome.ctaPublicPage')}
            </Button>
          </Section>
        </>
      )}

      <Text style={highlightBox} dangerouslySetInnerHTML={{ __html: `<strong>${t('welcome.tipTitle')}</strong> ${t('welcome.tipText')}` }} />

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

const subheading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px 0',
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
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px 0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
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

const buttonSecondary = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const stepsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '2',
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
