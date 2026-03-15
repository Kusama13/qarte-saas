import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface Tier2UpsellEmailProps {
  shopName: string;
  totalCustomers: number;
  rewardDescription: string;
  referralCode?: string;
  locale?: EmailLocale;
}

export function Tier2UpsellEmail({ shopName, totalCustomers, rewardDescription, referralCode, locale = 'fr' }: Tier2UpsellEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('tier2Upsell.preview')} locale={locale}>
      <Heading style={heading}>
        {t('tier2Upsell.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('tier2Upsell.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('tier2Upsell.intro', { totalCustomers: String(totalCustomers) }) }} />

      <Section style={vipBox}>
        <Text style={vipTitle}>{t('tier2Upsell.whatIsTitle')}</Text>
        <Text style={vipText}>
          {t('tier2Upsell.whatIsText')}
        </Text>
      </Section>

      <Section style={exampleBox}>
        <Text style={exampleItem}>
          {t('tier2Upsell.currentReward', { rewardDescription })}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          {t('tier2Upsell.ctaSetup')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('tier2Upsell.signature')}
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

const vipBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #e9d5ff',
  textAlign: 'center' as const,
};

const vipTitle = {
  color: '#7c3aed',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const vipText = {
  color: '#6b21a8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const exampleBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const exampleItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 4px 0',
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

export default Tier2UpsellEmail;
