import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface PendingPointsEmailProps {
  shopName: string;
  pendingCount: number;
  dashboardUrl?: string;
  isReminder?: boolean;
  daysSinceFirst?: number;
  locale?: EmailLocale;
}

export function PendingPointsEmail({
  shopName,
  pendingCount,
  dashboardUrl = 'https://getqarte.com/dashboard',
  isReminder = false,
  daysSinceFirst,
  locale = 'fr',
}: PendingPointsEmailProps) {
  const t = getEmailT(locale);
  const pluralSuffix = pendingCount > 1 ? 's' : '';
  const verbPlural = pendingCount > 1 ? 'nt' : '';
  const daysPlural = daysSinceFirst && daysSinceFirst > 1 ? 's' : '';

  const preview = t('pendingPoints.preview', { shopName, pendingCount: String(pendingCount), plural: pluralSuffix });

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {t('pendingPoints.heading', { pendingCount: String(pendingCount), plural: pluralSuffix })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('pendingPoints.greeting', { shopName }) }} />

      {isReminder ? (
        <Text style={paragraph}>
          {t('pendingPoints.introReminder', { pendingCount: String(pendingCount), plural: pluralSuffix, daysSinceFirst: String(daysSinceFirst || 0), daysPlural })}
        </Text>
      ) : (
        <Text style={paragraph}>
          {t('pendingPoints.introNew', { pendingCount: String(pendingCount), plural: pluralSuffix, verbPlural })}
        </Text>
      )}

      <Section style={alertBox}>
        <Text style={alertText}>
          <strong style={{ fontSize: '24px' }}>{pendingCount}</strong>
          <br />
          {t('pendingPoints.heading', { pendingCount: String(pendingCount), plural: pluralSuffix })}
        </Text>
      </Section>

      <Text style={paragraph}>
        {t('pendingPoints.helpText')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          {t('pendingPoints.ctaModerate')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('pendingPoints.signature')}
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

const alertBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #F59E0B',
};

const alertText = {
  color: '#92400E',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '1.4',
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

export default PendingPointsEmail;
