import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface FirstRewardEmailProps {
  shopName: string;
  rewardDescription: string;
  referralCode?: string;
  isCagnotte?: boolean;
  locale?: EmailLocale;
}

export function FirstRewardEmail({ shopName, rewardDescription, referralCode, isCagnotte, locale = 'fr' }: FirstRewardEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('firstReward.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('firstReward.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('firstReward.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('firstReward.intro')}
      </Text>

      <Section style={rewardBox}>
        <Text style={rewardLabel}>{t('firstReward.rewardLabel')}</Text>
        <Text style={rewardText}>{rewardDescription}</Text>
      </Section>

      <Section style={statsBox}>
        <Text style={statsTitle}>{t('firstReward.impactTitle')}</Text>
        <Text style={statsText}>
          {t('firstReward.impactText')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('firstReward.ctaDashboard')}
        </Button>
      </Section>

      <Section style={nextStepBox}>
        <Text style={nextStepTitle}>{t('firstReward.nextStepTitle')}</Text>
        <Text style={nextStepText}>
          {t('firstReward.nextStepText')}
        </Text>
      </Section>

      <Text style={signature}>
        {t('firstReward.signature')}
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

const rewardBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #fde68a',
};

const rewardEmoji = {
  fontSize: '40px',
  margin: '0 0 8px 0',
};

const rewardLabel = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
};

const rewardText = {
  color: '#78350f',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
};

const statsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const statsTitle = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const statsText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const nextStepBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const nextStepTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const nextStepText = {
  color: '#4a5568',
  fontSize: '14px',
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

export default FirstRewardEmail;
