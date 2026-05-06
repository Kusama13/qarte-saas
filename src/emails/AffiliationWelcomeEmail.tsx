import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import { getEmailT, type EmailLocale } from './translations';

export const AFFILIATION_PROMO_CODE = 'QARTEAFFI2026005';

interface AffiliationWelcomeEmailProps {
  shopName: string;
  parentShopName: string | null;
  locale?: EmailLocale;
}

export function AffiliationWelcomeEmail({ shopName, parentShopName, locale = 'fr' }: AffiliationWelcomeEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('affiliationWelcome.preview', { code: AFFILIATION_PROMO_CODE })} locale={locale}>
      <Heading style={heading}>
        {t('affiliationWelcome.heading', { shopName })}
      </Heading>

      <Text
        style={paragraph}
        dangerouslySetInnerHTML={{
          __html: parentShopName
            ? t('affiliationWelcome.introWithParent', { parentShopName })
            : t('affiliationWelcome.introNoParent'),
        }}
      />

      <Section style={codeBox}>
        <Text style={codeLabel}>{t('affiliationWelcome.codeLabel')}</Text>
        <Text style={codeValue}>{AFFILIATION_PROMO_CODE}</Text>
      </Section>

      <Text style={paragraph}>
        {t('affiliationWelcome.codeHint')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('affiliationWelcome.cta')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        {t('affiliationWelcome.helpText')}
      </Text>

      <EmailSignoff>{t('affiliationWelcome.signature')}</EmailSignoff>
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

const codeBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #d8cffa',
  textAlign: 'center' as const,
};

const codeLabel = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
};

const codeValue = {
  color: '#1a1a1a',
  fontFamily: 'monospace',
  fontSize: '22px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  margin: '0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0 0 0',
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

export default AffiliationWelcomeEmail;
