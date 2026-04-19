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
  /** Recommended tier based on activation usage. When set, shows a 2-card chooser instead of the legacy price block. */
  recommendedTier?: 'fidelity' | 'all_in' | null;
  /** Activation score (0-3) — number of pillars activated (fidelity, planning, vitrine). */
  activationState?: 0 | 1 | 2 | 3;
  /** Total customers count (for endowment effect in body). */
  customerCount?: number;
  /** Online bookings count (for endowment effect in body). */
  bookingCount?: number;
  locale?: EmailLocale;
}

export function TrialEndingEmail({
  shopName,
  daysRemaining,
  recommendedTier = null,
  activationState = 0,
  customerCount = 0,
  bookingCount = 0,
  locale = 'fr',
}: TrialEndingEmailProps) {
  const t = getEmailT(locale);
  const isUrgent = daysRemaining <= 1;
  const daysPlural = daysRemaining > 1 ? 's' : '';
  const showStats = activationState >= 1 && (customerCount > 0 || bookingCount > 0);

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

      {showStats && (
        <Section style={statsBox}>
          <Text style={statsLabel}>
            {t('trialEnding.statsLabel', { shopName })}
          </Text>
          <Text style={statsLine}>
            {customerCount > 0 && (
              <>
                <span style={statsValue}>{customerCount} </span>
                {t('trialEnding.statsCustomers', { plural: customerCount > 1 ? 's' : '' })}
              </>
            )}
            {customerCount > 0 && bookingCount > 0 && ' · '}
            {bookingCount > 0 && (
              <>
                <span style={statsValue}>{bookingCount} </span>
                {t('trialEnding.statsBookings', { plural: bookingCount > 1 ? 's' : '' })}
              </>
            )}
          </Text>
        </Section>
      )}

      {recommendedTier ? (
        <>
          <Text style={paragraph}>{t('trialEnding.tierIntro')}</Text>
          <Section style={recommendedTier === 'all_in' ? tierBoxRecommended : tierBox}>
            {recommendedTier === 'all_in' && <Text style={tierBadge}>{t('trialEnding.tierRecommendedBadge')}</Text>}
            <Text style={tierName}>{t('trialEnding.tierAllInName')}</Text>
            <Text style={tierPrice}>{t('trialEnding.tierAllInPrice')}</Text>
            <Text style={tierDesc}>{t('trialEnding.tierAllInDesc')}</Text>
          </Section>
          <Section style={recommendedTier === 'fidelity' ? tierBoxRecommended : tierBox}>
            {recommendedTier === 'fidelity' && <Text style={tierBadge}>{t('trialEnding.tierRecommendedBadge')}</Text>}
            <Text style={tierName}>{t('trialEnding.tierFidelityName')}</Text>
            <Text style={tierPrice}>{t('trialEnding.tierFidelityPrice')}</Text>
            <Text style={tierDesc}>{t('trialEnding.tierFidelityDesc')}</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard/subscription">
              {t('trialEnding.tierCta')}
            </Button>
          </Section>
        </>
      ) : (
        <>
          <Section style={priceSection}>
            <Text style={priceLabel}>{t('trialEnding.subscriptionLabel')}</Text>
            <Text style={price}>{t('trialEnding.priceFull')}<span style={priceMonth}>{t('trialEnding.priceFullSuffix')}</span></Text>
            <Text style={priceNoteStyle}>{t('trialEnding.priceNote')}</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard/subscription">
              {t('trialEnding.ctaNoPromo')}
            </Button>
          </Section>
        </>
      )}

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

const statsBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '16px 24px',
  margin: '0 0 24px 0',
  borderLeft: '4px solid #f59e0b',
  textAlign: 'center' as const,
};
const statsLabel = { color: '#92400e', fontSize: '13px', fontWeight: '500' as const, margin: '0 0 6px 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
const statsLine = { color: '#1a1a1a', fontSize: '17px', fontWeight: '600' as const, margin: '0' };
const statsValue = { color: '#7c3aed', fontWeight: '800' as const };

const tierBox = { backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '20px 24px', margin: '0 0 12px 0', borderLeft: '4px solid #94a3b8' };
const tierBoxRecommended = { backgroundColor: '#faf5ff', borderRadius: '12px', padding: '20px 24px', margin: '0 0 12px 0', borderLeft: '4px solid #7c3aed', position: 'relative' as const };
const tierBadge = { display: 'inline-block', backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '10px', fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '3px 8px', borderRadius: '4px', margin: '0 0 8px 0' };
const tierName = { color: '#1a1a1a', fontSize: '17px', fontWeight: '700' as const, margin: '0 0 4px 0' };
const tierPrice = { color: '#7c3aed', fontSize: '20px', fontWeight: '800' as const, margin: '0 0 8px 0' };
const tierDesc = { color: '#4a5568', fontSize: '14px', lineHeight: '1.6', margin: '0' };

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default TrialEndingEmail;
