import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SetupForYouEmailProps {
  email: string;
  locale?: EmailLocale;
}

export function SetupForYouEmail({ email, locale = 'fr' }: SetupForYouEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('setupForYou.preview')} locale={locale}>
      <Heading style={heading}>
        {t('setupForYou.heading')}
      </Heading>

      <Text style={paragraph}>
        {t('setupForYou.greeting')}
      </Text>

      <Text style={paragraph}>
        {t('setupForYou.body1', { email })}
      </Text>

      <Text style={paragraph}>
        {t('setupForYou.body2')}
      </Text>

      <Section style={offerBox}>
        <Text style={offerTitle}>{t('setupForYou.offerTitle')}</Text>
        <Text style={offerText}>
          {t('setupForYou.offerIntro')}
        </Text>
        <Text style={offerList}>
          &bull; {t('setupForYou.offerList1')}<br />
          &bull; {t('setupForYou.offerList2')}<br />
          &bull; {t('setupForYou.offerList3')}
        </Text>
        <Text style={offerText} dangerouslySetInnerHTML={{ __html: t('setupForYou.offerResult') }} />
      </Section>

      <Text style={paragraph}>
        {t('setupForYou.selfSetup')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          {t('setupForYou.cta')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('setupForYou.signaturePrefix')}
        <br />
        {t('setupForYou.signature')}
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

const offerBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #10b981',
};

const offerTitle = {
  color: '#065f46',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const offerText = {
  color: '#065f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const offerList = {
  color: '#065f46',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0 0 12px 0',
  paddingLeft: '8px',
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

export default SetupForYouEmail;
