import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface Day5CheckinEmailProps {
  shopName: string;
  totalScans: number;
  referralCode?: string;
  locale?: EmailLocale;
}

export function Day5CheckinEmail({ shopName, totalScans, locale = 'fr' }: Day5CheckinEmailProps) {
  const t = getEmailT(locale);
  const hasScans = totalScans > 0;

  return (
    <BaseLayout preview={t('day5Checkin.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('day5Checkin.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('day5Checkin.greeting', { shopName }) }} />

      {hasScans ? (
        <>
          <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('day5Checkin.introWithScans', { totalScans, scansPlural: totalScans > 1 ? 's' : '' }) }} />

          <Section style={tipsBox}>
            <Text style={tipsTitle}>{t('day5Checkin.tipsTitle')}</Text>
            <Text style={tipItem}>{t('day5Checkin.tip1')}</Text>
            <Text style={tipItem}>{t('day5Checkin.tip2')}</Text>
            <Text style={tipItem}>{t('day5Checkin.tip3')}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard">
              {t('day5Checkin.ctaDashboard')}
            </Button>
          </Section>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            {t('day5Checkin.introNoScans')}
          </Text>

          <Section style={tipsBox}>
            <Text style={tipsTitle}>{t('day5Checkin.tipsTitle')}</Text>
            <Text style={tipItem}>{t('day5Checkin.tip1')}</Text>
            <Text style={tipItem}>{t('day5Checkin.tip2')}</Text>
            <Text style={tipItem}>{t('day5Checkin.tip3')}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard">
              {t('day5Checkin.ctaDashboard')}
            </Button>
          </Section>
        </>
      )}

      <Text style={signature}>
        {t('day5Checkin.signature')}
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

export default Day5CheckinEmail;
