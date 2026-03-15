import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface TrialEndingEmailProps {
  shopName: string;
  daysRemaining: number;
  promoCode?: string;
  locale?: EmailLocale;
}

export function TrialEndingEmail({ shopName, daysRemaining, promoCode, locale = 'fr' }: TrialEndingEmailProps) {
  const t = getEmailT(locale);
  const isUrgent = daysRemaining <= 1;
  const daysPlural = daysRemaining > 1 ? 's' : '';

  return (
    <BaseLayout preview={t('trialEnding.preview', { daysRemaining: String(daysRemaining), daysPlural })} locale={locale}>
      <Heading style={heading}>
        {t('trialEnding.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('trialEnding.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('trialEnding.intro')}
        <strong style={isUrgent ? urgentText : highlight}>
          {t('trialEnding.daysLabel', { daysRemaining: String(daysRemaining), daysPlural })}
        </strong>.
      </Text>

      <Section style={isUrgent ? urgentBox : infoBox}>
        <Text style={boxText}>
          {isUrgent
            ? t('trialEnding.urgentMessage')
            : t('trialEnding.normalMessage')}
        </Text>
        <Text style={{ ...boxText, marginTop: '12px' }}>
          {t('trialEnding.lossWarning')}
        </Text>
      </Section>

      <Section style={priceSection}>
        <Text style={priceLabel}>{t('trialEnding.subscriptionLabel')}</Text>
        {promoCode ? (
          <>
            <Text style={priceOld}>{t('trialEnding.priceOld')}</Text>
            <Text style={price}>{t('trialEnding.pricePromo')}<span style={priceMonth}>{t('trialEnding.pricePromoSuffix')}</span></Text>
            <Section style={promoBox}>
              <Text style={promoLabelStyle}>{t('trialEnding.promoLabel')}</Text>
              <Text style={promoCodeStyle}>{promoCode}</Text>
              <Text style={promoNote}>{t('trialEnding.promoNote')}</Text>
            </Section>
          </>
        ) : (
          <Text style={price}>{t('trialEnding.priceFull')}<span style={priceMonth}>{t('trialEnding.priceFullSuffix')}</span></Text>
        )}
        <Text style={priceNoteStyle}>{t('trialEnding.priceNote')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {promoCode ? t('trialEnding.ctaPromo') : t('trialEnding.ctaNoPromo')}
        </Button>
      </Section>

      <Section style={socialProofBox}>
        <Text style={socialProofText}>
          {t('trialEnding.socialProof')}{' '}
          <a href="https://getqarte.com/pros" style={socialProofLinkStyle}>{t('trialEnding.socialProofLink')}</a>
        </Text>
      </Section>

      <Text style={paragraph}>
        {t('trialEnding.thankYou')}
      </Text>

      <Text style={signature}>
        {t('trialEnding.signature')}
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

const highlight = {
  color: '#4b0082',
};

const urgentText = {
  color: '#dc2626',
};

const infoBox = {
  backgroundColor: '#f0f4ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #dc2626',
};

const boxText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const priceSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const priceLabel = {
  color: '#8898aa',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const price = {
  color: '#1a1a1a',
  fontSize: '48px',
  fontWeight: '700',
  margin: '0',
};

const priceMonth = {
  fontSize: '18px',
  fontWeight: '400',
  color: '#8898aa',
};

const priceOld = {
  color: '#8898aa',
  fontSize: '24px',
  fontWeight: '400',
  margin: '0',
  textDecoration: 'line-through',
  textAlign: 'center' as const,
};

const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '16px 24px',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
  border: '2px dashed #4b0082',
};

const promoLabelStyle = {
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

const promoNote = {
  color: '#4b0082',
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const priceNoteStyle = {
  color: '#8898aa',
  fontSize: '14px',
  margin: '8px 0 0 0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default TrialEndingEmail;
