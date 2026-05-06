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

interface AffiliateConversionEmailProps {
  parentShopName: string;
  filleulShopName: string;
  locale?: EmailLocale;
}

export function AffiliateConversionEmail({ parentShopName, filleulShopName, locale = 'fr' }: AffiliateConversionEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('affiliateConversion.preview')} locale={locale}>
      <Heading style={heading}>
        {t('affiliateConversion.heading', { parentShopName })}
      </Heading>

      <Text
        style={paragraph}
        dangerouslySetInnerHTML={{ __html: t('affiliateConversion.intro', { filleulShopName }) }}
      />

      <Section style={rewardBox}>
        <Text style={rewardTitle}>{t('affiliateConversion.rewardTitle')}</Text>
        <Text
          style={rewardBody}
          dangerouslySetInnerHTML={{ __html: t('affiliateConversion.rewardBody') }}
        />
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('affiliateConversion.cta')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        {t('affiliateConversion.nudge')}
      </Text>

      <EmailSignoff>{t('affiliateConversion.signature')}</EmailSignoff>
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
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #10b981',
};

const rewardTitle = {
  color: '#065f46',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const rewardBody = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
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
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

export default AffiliateConversionEmail;
