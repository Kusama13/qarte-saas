import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import { getEmailT, type EmailLocale } from './translations';

interface TrialFinalDayEmailProps {
  shopName: string;
  slug?: string | null;
  locale?: EmailLocale;
}

export function TrialFinalDayEmail({ shopName, slug, locale = 'fr' }: TrialFinalDayEmailProps) {
  const t = getEmailT(locale);
  const pageLabel = slug ? `getqarte.com/p/${slug}` : t('trialFinalDay.pageFallback');

  return (
    <BaseLayout preview={t('trialFinalDay.preview', { shopName })} locale={locale}>
      <Heading style={heading}>{t('trialFinalDay.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('trialFinalDay.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('trialFinalDay.intro')}</Text>

      {/* Liste sobre de ce qui se passe sans action — pas de side-stripe, full border discrète */}
      <Section style={consequencesBox}>
        <Text style={consequenceLine}>
          <span style={consequenceMark}>·</span>
          <span dangerouslySetInnerHTML={{ __html: t('trialFinalDay.consequence1', { page: pageLabel }) }} />
        </Text>
        <Text style={consequenceLine}>
          <span style={consequenceMark}>·</span>
          {t('trialFinalDay.consequence2')}
        </Text>
        <Text style={consequenceLine}>
          <span style={consequenceMark}>·</span>
          {t('trialFinalDay.consequence3')}
        </Text>
      </Section>

      <Text style={paragraph}>{t('trialFinalDay.body')}</Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('trialFinalDay.cta')}
        </Button>
      </Section>

      <Text style={footerNote}>{t('trialFinalDay.footerNote')}</Text>

      <EmailSignoff>{t('trialFinalDay.signature')}</EmailSignoff>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700' as const,
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const consequencesBox = {
  backgroundColor: '#fefce8',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '18px 22px',
  margin: '20px 0 24px 0',
};

const consequenceLine = {
  color: '#3f3f46',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const consequenceMark = {
  color: '#a16207',
  fontWeight: '700' as const,
  marginRight: '10px',
  fontSize: '18px',
  verticalAlign: 'middle' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0 16px 0',
};

const button = {
  backgroundColor: '#4b0082',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const footerNote = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

export default TrialFinalDayEmail;
