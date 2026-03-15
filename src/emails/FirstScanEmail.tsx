import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface FirstScanEmailProps {
  shopName: string;
  referralCode?: string;
  slug?: string;
  locale?: EmailLocale;
}

export function FirstScanEmail({ shopName, slug, locale = 'fr' }: FirstScanEmailProps) {
  const t = getEmailT(locale);
  const publicPageUrl = slug ? `https://getqarte.com/p/${slug}` : null;

  return (
    <BaseLayout preview={t('firstScan.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('firstScan.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('firstScan.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('firstScan.intro')}
      </Text>

      <Section style={celebrationBox}>
        <Text style={celebrationTitle}>{t('firstScan.celebrationTitle')}</Text>
        <Text style={celebrationText}>
          {t('firstScan.celebrationText')}
        </Text>
      </Section>

      <Section style={tipsBox}>
        <Text style={tipsTitle}>{t('firstScan.tipsTitle')}</Text>
        <Text style={tipItem}>{t('firstScan.tip1')}</Text>
        <Text style={tipItem}>{t('firstScan.tip2')}</Text>
        <Text style={tipItem}>{t('firstScan.tip3')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('firstScan.ctaStats')}
        </Button>
      </Section>

      {publicPageUrl && (
        <Section style={pageProBox}>
          <Text style={pageProTitle}>{t('firstScan.shareTitle')}</Text>
          <Text style={pageProText}>
            {t('firstScan.shareText')}
          </Text>
          <Section style={buttonContainerSmall}>
            <Button style={buttonSecondary} href={publicPageUrl}>
              {t('firstScan.ctaPublicPage')}
            </Button>
          </Section>
        </Section>
      )}

      <Text style={signature}>
        {t('firstScan.signature')}
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

const celebrationBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #bbf7d0',
};

const celebrationEmoji = {
  fontSize: '40px',
  margin: '0 0 8px 0',
};

const celebrationTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const celebrationText = {
  color: '#15803d',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const tipsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const tipsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const tipItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
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

const pageProBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const pageProTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const pageProText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainerSmall = {
  textAlign: 'center' as const,
  margin: '16px 0 0 0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default FirstScanEmail;
