import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SubscriptionReactivatedEmailProps {
  shopName: string;
  referralCode?: string;
  locale?: EmailLocale;
}

export function SubscriptionReactivatedEmail({ shopName, referralCode, locale = 'fr' }: SubscriptionReactivatedEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('subscriptionReactivated.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('subscriptionReactivated.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('subscriptionReactivated.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('subscriptionReactivated.intro')}
      </Text>

      <Section style={confirmBox}>
        <Text style={confirmTitle}>{t('subscriptionReactivated.confirmTitle')}</Text>
        <Text style={confirmDetail}>{t('subscriptionReactivated.confirmDetail')}</Text>
        <Text style={confirmNote}>
          {t('subscriptionReactivated.confirmNote')}
        </Text>
      </Section>

      <Section style={features}>
        <Text style={featureTitle}>{t('subscriptionReactivated.featuresTitle')}</Text>
        <Text style={featureItem}>{t('subscriptionReactivated.feature1')}</Text>
        <Text style={featureItem}>{t('subscriptionReactivated.feature2')}</Text>
        <Text style={featureItem}>{t('subscriptionReactivated.feature3')}</Text>
        <Text style={featureItem}>{t('subscriptionReactivated.feature4')}</Text>
        <Text style={featureItem}>{t('subscriptionReactivated.feature5')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('subscriptionReactivated.ctaDashboard')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('subscriptionReactivated.thankYou')}
      </Text>

      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitleStyle} dangerouslySetInnerHTML={{ __html: t('subscriptionReactivated.referralTitle') }} />
          <Text style={referralTextStyle} dangerouslySetInnerHTML={{ __html: t('subscriptionReactivated.referralText') }} />
          <Text style={referralCode_style} dangerouslySetInnerHTML={{ __html: t('subscriptionReactivated.referralCodeLabel', { referralCode }) }} />
          <Text style={referralHintStyle}>
            {t('subscriptionReactivated.referralHint')}
          </Text>
        </Section>
      )}

      <Text style={signature}>
        {t('subscriptionReactivated.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
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

const confirmBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #bbf7d0',
  textAlign: 'center' as const,
};

const confirmTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const confirmDetail = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 4px 0',
};

const confirmNote = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const features = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const featureItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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

const referralBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const referralTitleStyle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const referralTextStyle = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const referralCode_style = {
  color: '#4b0082',
  fontSize: '18px',
  fontWeight: '700',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
  padding: '8px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px dashed #c4b5fd',
};

const referralHintStyle = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};

export default SubscriptionReactivatedEmail;
