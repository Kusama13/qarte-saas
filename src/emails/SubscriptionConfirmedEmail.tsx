import {
  Button,
  Heading,
  Img,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SubscriptionConfirmedEmailProps {
  shopName: string;
  nextBillingDate?: string;
  billingInterval?: 'monthly' | 'annual';
  referralCode?: string;
  /** Plan tier — change le label + les features listées (plan v2). */
  planTier?: 'fidelity' | 'all_in';
  locale?: EmailLocale;
}

export function SubscriptionConfirmedEmail({ shopName, nextBillingDate, billingInterval, referralCode, planTier = 'all_in', locale = 'fr' }: SubscriptionConfirmedEmailProps) {
  const t = getEmailT(locale);
  const planLabel = billingInterval === 'annual' ? t('subscriptionConfirmed.planAnnual') : t('subscriptionConfirmed.planMonthly');
  const tierName = planTier === 'fidelity' ? t('subscriptionConfirmed.tierFidelityName') : t('subscriptionConfirmed.tierAllInName');

  return (
    <BaseLayout preview={t('subscriptionConfirmed.preview')} locale={locale}>
      <Heading style={heading}>
        {t('subscriptionConfirmed.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('subscriptionConfirmed.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: planTier === 'fidelity' ? t('subscriptionConfirmed.introFidelity') : t('subscriptionConfirmed.introAllIn') }} />

      <Section style={confirmBox}>
        <Text style={confirmTitle}>{tierName}</Text>
        <Text style={confirmDetail}>{t('subscriptionConfirmed.planLabel', { planLabel })}</Text>
        <Text style={confirmNote}>
          {nextBillingDate
            ? t('subscriptionConfirmed.nextBillingDate', { date: nextBillingDate })
            : billingInterval === 'annual'
              ? t('subscriptionConfirmed.nextBillingAnnual')
              : t('subscriptionConfirmed.nextBillingMonthly')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('subscriptionConfirmed.ctaDashboard')}
        </Button>
      </Section>

      {billingInterval === 'annual' ? (
        <Section style={nfcBoxAnnual}>
          <Section style={nfcImgContainer}>
            <Img
              src="https://getqarte.com/images/Carte%20NFC%20QARTE%20.png"
              alt="Carte NFC Qarte"
              width={160}
              style={nfcImg}
            />
          </Section>
          <Text style={nfcTitleAnnualStyle}>{t('subscriptionConfirmed.nfcTitleAnnual')}</Text>
          <Text style={nfcTextStyle}>
            {t('subscriptionConfirmed.nfcTextAnnual')}
          </Text>
        </Section>
      ) : (
        <Section style={nfcBox}>
          <Section style={nfcImgContainer}>
            <Img
              src="https://getqarte.com/images/Carte%20NFC%20QARTE%20.png"
              alt="Carte NFC Qarte"
              width={160}
              style={nfcImg}
            />
          </Section>
          <Text style={nfcTitleStyle}>{t('subscriptionConfirmed.nfcTitle')}</Text>
          <Text style={nfcTextStyle}>
            {t('subscriptionConfirmed.nfcText')}
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '12px 0 0 0' }}>
            <Button style={nfcButton} href="https://buy.stripe.com/4gM7sN6DYccX75dduH7g401">
              {t('subscriptionConfirmed.nfcCta')}
            </Button>
          </Section>
        </Section>
      )}

      <Text style={paragraph}>
        {t('subscriptionConfirmed.questionText')}
      </Text>

      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitleStyle} dangerouslySetInnerHTML={{ __html: t('subscriptionConfirmed.referralTitle') }} />
          <Text style={referralTextStyle} dangerouslySetInnerHTML={{ __html: t('subscriptionConfirmed.referralText') }} />
          <Text style={referralCode_style} dangerouslySetInnerHTML={{ __html: t('subscriptionConfirmed.referralCodeLabel', { referralCode }) }} />
          <Text style={referralHintStyle}>
            {t('subscriptionConfirmed.referralHint')}
          </Text>
        </Section>
      )}

      <Text style={signature}>
        {t('subscriptionConfirmed.signaturePrefix')}<br />
        {t('subscriptionConfirmed.signature')}
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

const confirmBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #bbf7d0',
  textAlign: 'center' as const,
};

const confirmTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const confirmDetail = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 4px 0',
};

const confirmNote = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

const referralBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const referralTitleStyle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const referralTextStyle = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const referralCode_style = {
  color: '#4b0082',
  fontSize: '18px',
  fontWeight: '700',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
  padding: '8px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px dashed #c4b5fd',
};

const referralHintStyle = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};

const nfcBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const nfcBoxAnnual = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '2px solid #bbf7d0',
};

const nfcTitleAnnualStyle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 10px 0',
  textAlign: 'center' as const,
};

const nfcTitleStyle = {
  color: '#4b0082',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 10px 0',
};

const nfcTextStyle = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const nfcImgContainer = {
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};

const nfcImg = {
  borderRadius: '10px',
  display: 'block',
  margin: '0 auto',
};

const nfcButton = {
  backgroundColor: '#4b0082',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

export default SubscriptionConfirmedEmail;
