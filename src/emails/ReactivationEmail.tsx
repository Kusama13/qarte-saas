import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ReactivationEmailProps {
  shopName: string;
  daysSinceCancellation: number;
  totalCustomers?: number;
  promoCode?: string;
  promoMonths?: number;
  locale?: EmailLocale;
}

export function ReactivationEmail({
  shopName,
  daysSinceCancellation,
  totalCustomers,
  promoCode,
  promoMonths = 1,
  locale = 'fr',
}: ReactivationEmailProps) {
  const t = getEmailT(locale);
  const isLastChance = daysSinceCancellation >= 25;
  const isMidTerm = daysSinceCancellation >= 12 && daysSinceCancellation < 25;

  return (
    <BaseLayout preview={
      isLastChance
        ? t('reactivation.lastChance')
        : t('reactivation.preview', { shopName })
    } locale={locale}>
      {/* ===== LAST CHANCE ===== */}
      {isLastChance && (
        <>
          <Section style={urgentBanner}>
            <Text style={urgentBannerText}>{t('reactivation.lastChance')}</Text>
          </Section>

          <Heading style={urgentHeading}>
            {t('reactivation.heading')}
          </Heading>

          <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('reactivation.greeting', { shopName }) }} />

          {totalCustomers && totalCustomers > 0 ? (
            <Text style={paragraph}>
              {t('reactivation.clientsNoAccess', { totalCustomers: String(totalCustomers) })}
            </Text>
          ) : (
            <Text style={paragraph}>
              {t('reactivation.clientsNoAccessGeneric')}
            </Text>
          )}

          <Text style={paragraph}>
            {t('reactivation.dataStillHere')}
          </Text>
        </>
      )}

      {/* ===== MID-TERM WIN-BACK ===== */}
      {isMidTerm && (
        <>
          <Heading style={heading}>
            {t('reactivation.heading')}
          </Heading>

          <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('reactivation.greeting', { shopName }) }} />

          {totalCustomers && totalCustomers > 0 ? (
            <Text style={paragraph}>
              {t('reactivation.clientsNoAccess', { totalCustomers: String(totalCustomers) })}
            </Text>
          ) : (
            <Text style={paragraph}>
              {t('reactivation.clientsNoAccessGeneric')}
            </Text>
          )}

          <Text style={paragraph}>
            {t('reactivation.dataStillHere')}
          </Text>
        </>
      )}

      {/* ===== FIRST CONTACT ===== */}
      {!isLastChance && !isMidTerm && (
        <>
          <Heading style={heading}>
            {t('reactivation.heading')}
          </Heading>

          <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('reactivation.greeting', { shopName }) }} />

          {totalCustomers && totalCustomers > 0 ? (
            <Text style={paragraph}>
              {t('reactivation.clientsNoAccess', { totalCustomers: String(totalCustomers) })}
            </Text>
          ) : (
            <Text style={paragraph}>
              {t('reactivation.clientsNoAccessGeneric')}
            </Text>
          )}

          <Text style={paragraph}>
            {t('reactivation.dataStillHere')}
          </Text>
        </>
      )}

      {/* ===== PROMO BOX ===== */}
      {promoCode ? (
        <Section style={isLastChance ? urgentPromoBox : promoBox}>
          <Text style={isLastChance ? urgentPromoTitleStyle : promoTitleStyle}>
            {t('reactivation.promoTitle')}
          </Text>
          <Text style={promoPrice}>
            {t('reactivation.promoText', { promoMonths: String(promoMonths) })}
          </Text>
          <Text style={promoLabel}>CODE PROMO</Text>
          <Text style={promoCodeStyled}>{promoCode}</Text>
        </Section>
      ) : null}

      <Section style={buttonContainer}>
        <Button style={isLastChance ? urgentButton : button} href="https://getqarte.com/dashboard/subscription">
          {t('reactivation.ctaReactivate')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('reactivation.noCommitment')}
      </Text>

      <Text style={signature}>
        {t('reactivation.signature')}
      </Text>
    </BaseLayout>
  );
}

// === COMMON STYLES ===

const heading = {
  color: '#4b0082',
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

// === PROMO STYLES ===

const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px dashed #4b0082',
};

const promoTitleStyle = {
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

const promoCodeStyled = {
  color: '#4b0082',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '2px',
};

// === BUTTON STYLES ===

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

// === URGENT STYLES ===

const urgentBanner = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  padding: '12px 24px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const urgentBannerText = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const urgentHeading = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const urgentPromoBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px dashed #dc2626',
};

const urgentPromoTitleStyle = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const urgentButton = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '16px 32px',
};

export default ReactivationEmail;
