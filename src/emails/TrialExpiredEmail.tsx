import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface TrialExpiredEmailProps {
  shopName: string;
  daysUntilDeletion: number;
  promoCode?: string;
  locale?: EmailLocale;
}

export function TrialExpiredEmail({ shopName, daysUntilDeletion, promoCode, locale = 'fr' }: TrialExpiredEmailProps) {
  const t = getEmailT(locale);
  const daysPlural = daysUntilDeletion > 1 ? 's' : '';

  return (
    <BaseLayout preview={t('trialExpired.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('trialExpired.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('trialExpired.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('trialExpired.intro') }} />

      <Section style={infoBox}>
        <Text style={infoTitle}>{t('trialExpired.whatHappensTitle')}</Text>
        <Text style={infoText}>
          {t('trialExpired.whatHappensText')}
        </Text>
        <Text style={infoText} dangerouslySetInnerHTML={{ __html: t('trialExpired.dataRetention', { daysUntilDeletion: String(daysUntilDeletion), daysPlural }) }} />
      </Section>

      {promoCode ? (
        <Section style={promoBoxStyle}>
          <Text style={promoTitle}>{t('trialExpired.specialOfferTitle')}</Text>
          <Text style={promoPrice} dangerouslySetInnerHTML={{ __html: t('trialExpired.specialOfferPrice') }} />
          <Text style={promoLabel}>{t('trialExpired.promoLabel')}</Text>
          <Text style={promoCodeStyle}>{promoCode}</Text>
          <Text style={promoNoteStyle}>{t('trialExpired.promoNote')}</Text>
        </Section>
      ) : (
        <Section style={offerBox}>
          <Text style={offerTitle}>{t('trialExpired.helpTitle')}</Text>
          <Text style={offerText}>
            {t('trialExpired.helpText')}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {promoCode ? t('trialExpired.ctaPromo') : t('trialExpired.ctaNoPromo')}
        </Button>
      </Section>

      <Text style={noteText}>
        {t('trialExpired.noCommitment')}
      </Text>

      <Text style={paragraph}>
        {t('trialExpired.questionText')}
      </Text>

      <Text style={signature}>
        {t('trialExpired.signaturePrefix')}
        <br />
        {t('trialExpired.signature')}
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

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const infoTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#78350f',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const offerBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const offerTitle = {
  color: '#4b0082',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const offerText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
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

const promoBoxStyle = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px dashed #4b0082',
};

const promoTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const promoPrice = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 16px 0',
};

const promoLabel = {
  color: '#8898aa',
  fontSize: '11px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const promoCodeStyle = {
  color: '#4b0082',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '2px',
};

const promoNoteStyle = {
  color: '#4b0082',
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const noteText = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default TrialExpiredEmail;
