import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ReferralPromoEmailProps {
  shopName: string;
  slug: string;
  locale?: EmailLocale;
}

export function ReferralPromoEmail({ shopName, slug, locale = 'fr' }: ReferralPromoEmailProps) {
  const t = getEmailT(locale);
  const referralLink = `https://getqarte.com/?ref=${slug}`;

  return (
    <BaseLayout preview={t('referralPromo.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('referralPromo.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('referralPromo.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('referralPromo.intro')}
      </Text>

      <Section style={rewardBox}>
        <Text style={rewardTitle}>{t('referralPromo.rewardTitle')}</Text>
        <Text style={rewardAmount}>10 &euro;</Text>
        <Text style={rewardDetail}>{t('referralPromo.rewardDetail')}</Text>
      </Section>

      <Text style={paragraph}>
        {t('referralPromo.howItWorks')}
      </Text>

      <Section style={stepsBox}>
        <Text style={stepText}>
          <strong>1.</strong> {t('referralPromo.step1')}
        </Text>
        <Text style={stepText}>
          <strong>2.</strong> {t('referralPromo.step2')}
        </Text>
        <Text style={stepText}>
          <strong>3.</strong> {t('referralPromo.step3')}
        </Text>
      </Section>

      <Section style={linkBox}>
        <Text style={linkLabel}>{t('referralPromo.linkLabel')}</Text>
        <Text style={linkValue}>{referralLink}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={referralLink}>
          {t('referralPromo.cta')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('referralPromo.closing')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#111827',
  marginBottom: '16px',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '16px',
};

const rewardBox = {
  backgroundColor: '#f5f3ff',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  border: '1px solid #e0d7ff',
};

const rewardTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#6d28d9',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const rewardAmount = {
  fontSize: '48px',
  fontWeight: '800' as const,
  color: '#4b0082',
  marginBottom: '4px',
  lineHeight: '1',
};

const rewardDetail = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const stepsBox = {
  marginBottom: '24px',
};

const stepText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  marginBottom: '8px',
};

const linkBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb',
};

const linkLabel = {
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#6b7280',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
};

const linkValue = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#4b0082',
  margin: '0',
  wordBreak: 'break-all' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#4b0082',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700' as const,
  padding: '14px 32px',
  borderRadius: '12px',
  textDecoration: 'none',
};
