import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface GracePeriodSetupEmailProps {
  shopName: string;
  daysUntilDeletion: number;
  locale?: EmailLocale;
}

export function GracePeriodSetupEmail({ shopName, daysUntilDeletion, locale = 'fr' }: GracePeriodSetupEmailProps) {
  const t = getEmailT(locale);
  const daysPlural = daysUntilDeletion > 1 ? 's' : '';

  return (
    <BaseLayout preview={t('gracePeriodSetup.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('gracePeriodSetup.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('gracePeriodSetup.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('gracePeriodSetup.intro') }} />

      <Section style={infoBox}>
        <Text style={infoText} dangerouslySetInnerHTML={{ __html: t('gracePeriodSetup.dataRetention', { daysUntilDeletion: String(daysUntilDeletion), daysPlural }) }} />
      </Section>

      <Hr style={divider} />

      <Section style={offerBox}>
        <Text style={offerTitle}>{t('gracePeriodSetup.togetherTitle')}</Text>
        <Text style={offerText} dangerouslySetInnerHTML={{ __html: t('gracePeriodSetup.togetherText') }} />
        <Text style={offerList}>
          {t('gracePeriodSetup.togetherList1')}<br />
          {t('gracePeriodSetup.togetherList2')}
        </Text>
      </Section>

      <Text style={paragraph}>
        {t('gracePeriodSetup.selfSetup')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          {t('gracePeriodSetup.ctaSetup')}
        </Button>
      </Section>

      <Section style={reassuranceBox}>
        <Text style={reassuranceText} dangerouslySetInnerHTML={{ __html: t('gracePeriodSetup.reassurance') }} />
      </Section>

      <Section style={socialProofBox}>
        <Text style={socialProofText}>
          {t('gracePeriodSetup.socialProof')}{' '}
          <a href="https://getqarte.com/pros" style={socialProofLinkStyle}>{t('gracePeriodSetup.socialProofLink')}</a>
        </Text>
      </Section>

      <Text style={signature}>
        {t('gracePeriodSetup.signaturePrefix')}
        <br />
        {t('gracePeriodSetup.signature')}
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

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const infoText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const offerBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 8px 0',
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
  margin: '0',
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

const reassuranceBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
};

const reassuranceText = {
  color: '#4b0082',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

const socialProofBox = {
  backgroundColor: '#f5f3ff',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const socialProofText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

const socialProofLinkStyle = {
  color: '#4b0082',
  fontWeight: '600' as const,
  textDecoration: 'underline',
};

export default GracePeriodSetupEmail;
