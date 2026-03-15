import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface WeeklyDigestEmailProps {
  shopName: string;
  scansThisWeek: number;
  newCustomers: number;
  rewardsEarned: number;
  totalCustomers: number;
  referralCode?: string;
  locale?: EmailLocale;
}

export function WeeklyDigestEmail({
  shopName,
  scansThisWeek,
  newCustomers,
  rewardsEarned,
  totalCustomers,
  referralCode,
  locale = 'fr',
}: WeeklyDigestEmailProps) {
  const t = getEmailT(locale);
  const hasActivity = scansThisWeek > 0 || newCustomers > 0;

  return (
    <BaseLayout preview={t('weeklyDigest.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('weeklyDigest.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('weeklyDigest.greeting', { shopName }) }} />

      {hasActivity ? (
        <>
          <Section style={statsGrid}>
            <Section style={statCard}>
              <Text style={statNumber}>{scansThisWeek}</Text>
              <Text style={statLabel}>{t('weeklyDigest.scansLabel')}</Text>
            </Section>
            <Section style={statCard}>
              <Text style={statNumber}>{newCustomers}</Text>
              <Text style={statLabel}>{t('weeklyDigest.newCustomersLabel')}</Text>
            </Section>
            <Section style={statCard}>
              <Text style={statNumber}>{rewardsEarned}</Text>
              <Text style={statLabel}>{t('weeklyDigest.rewardsLabel')}</Text>
            </Section>
          </Section>

          <Section style={totalBox}>
            <Text style={totalText}>
              <strong>{totalCustomers}</strong> {t('weeklyDigest.totalCustomersLabel')}
            </Text>
          </Section>

          <Text style={paragraph}>
            {t('weeklyDigest.goodWeek')}
          </Text>
        </>
      ) : (
        <Text style={paragraph}>
          {t('weeklyDigest.noScans')}
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('weeklyDigest.ctaDashboard')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('weeklyDigest.signature')}
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

const statsGrid = {
  margin: '24px 0',
  textAlign: 'center' as const,
};

const statCard = {
  display: 'inline-block' as const,
  width: '30%',
  textAlign: 'center' as const,
  padding: '16px 8px',
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  margin: '0 4px',
};

const statNumber = {
  color: '#4b0082',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '4px 0 0 0',
};

const totalBox = {
  textAlign: 'center' as const,
  padding: '12px 20px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '0 0 24px 0',
};

const totalText = {
  color: '#166534',
  fontSize: '15px',
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

export default WeeklyDigestEmail;
