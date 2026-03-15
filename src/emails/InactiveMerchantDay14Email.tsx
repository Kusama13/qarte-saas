import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface InactiveMerchantDay14EmailProps {
  shopName: string;
  rewardDescription?: string;
  stampsRequired?: number;
  locale?: EmailLocale;
}

export function InactiveMerchantDay14Email({
  shopName,
  rewardDescription,
  stampsRequired,
  locale = 'fr',
}: InactiveMerchantDay14EmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('inactiveDay14.preview')} locale={locale}>
      <Heading style={heading}>
        {t('inactiveDay14.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('inactiveDay14.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('inactiveDay14.intro')}
      </Text>

      <Section style={scriptBox}>
        <Text style={scriptTitle}>{t('inactiveDay14.competitorTitle')}</Text>
        <Text style={scriptText}>
          {t('inactiveDay14.competitorText')}
        </Text>
      </Section>

      {rewardDescription && (
        <Section style={rewardBox}>
          <Text style={rewardLabel}>{t('inactiveDay14.yourProgram')}</Text>
          <Text style={rewardTextStyle}>
            {t('inactiveDay14.rewardLabel', { rewardDescription })}
            {stampsRequired ? ` — ${t('inactiveDay14.stampsLabel', { stampsRequired: String(stampsRequired) })}` : ''}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('inactiveDay14.ctaSetup')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('inactiveDay14.signature')}
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

const scriptBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const scriptTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const scriptText = {
  color: '#4a5568',
  fontSize: '15px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0',
};

const rewardBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
  border: '1px solid #bbf7d0',
  textAlign: 'center' as const,
};

const rewardLabel = {
  color: '#166534',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
};

const rewardTextStyle = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '600',
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

export default InactiveMerchantDay14Email;
