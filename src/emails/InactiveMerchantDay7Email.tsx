import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface InactiveMerchantDay7EmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function InactiveMerchantDay7Email({ shopName, locale = 'fr' }: InactiveMerchantDay7EmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('inactiveDay7.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('inactiveDay7.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('inactiveDay7.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('inactiveDay7.intro')}
      </Text>

      <Section style={checklistBox}>
        <Text style={checklistTitle}>{t('inactiveDay7.question')}</Text>
        <Text style={checklistItem}>
          {t('inactiveDay7.optionBusy')}
        </Text>
        <Text style={checklistItem}>
          {t('inactiveDay7.optionDontKnow')}
        </Text>
        <Text style={checklistItem}>
          {t('inactiveDay7.optionLater')}
        </Text>
      </Section>

      <Text style={paragraph}>
        {t('inactiveDay7.helpText')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('inactiveDay7.ctaDashboard')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('inactiveDay7.signature')}
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

const checklistBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const checklistTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const checklistItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.8',
  margin: '0 0 8px 0',
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

export default InactiveMerchantDay7Email;
