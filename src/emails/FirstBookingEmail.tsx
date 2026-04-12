import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface FirstBookingEmailProps {
  shopName: string;
  slug?: string;
  locale?: EmailLocale;
}

export function FirstBookingEmail({ shopName, slug, locale = 'fr' }: FirstBookingEmailProps) {
  const t = getEmailT(locale);
  const publicPageUrl = slug ? `https://getqarte.com/p/${slug}` : null;

  return (
    <BaseLayout preview={t('firstBooking.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('firstBooking.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('firstBooking.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('firstBooking.intro')}
      </Text>

      <Section style={celebrationBox}>
        <Text style={celebrationTitle}>{t('firstBooking.celebrationTitle')}</Text>
        <Text style={celebrationText}>
          {t('firstBooking.celebrationText')}
        </Text>
      </Section>

      <Section style={tipsBox}>
        <Text style={tipsTitle}>{t('firstBooking.tipsTitle')}</Text>
        <Text style={tipItem}>{t('firstBooking.tip1')}</Text>
        <Text style={tipItem}>{t('firstBooking.tip2')}</Text>
        <Text style={tipItem}>{t('firstBooking.tip3')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/planning">
          {t('firstBooking.cta')}
        </Button>
      </Section>

      {publicPageUrl && (
        <Section style={shareBox}>
          <Text style={shareTitle}>{t('firstBooking.shareTitle')}</Text>
          <Text style={shareText}>{t('firstBooking.shareText')}</Text>
          <Section style={buttonContainerSmall}>
            <Button style={buttonSecondary} href={publicPageUrl}>
              {t('firstBooking.ctaShare')}
            </Button>
          </Section>
        </Section>
      )}

      <Text style={signature}>
        {t('firstBooking.signature')}
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
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #bbf7d0',
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
  backgroundColor: '#f0edfc',
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
  backgroundColor: '#059669',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const shareBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const shareTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const shareText = {
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

export default FirstBookingEmail;
