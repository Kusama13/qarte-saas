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

interface WinBackEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function WinBackEmail({ shopName, locale = 'fr' }: WinBackEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('winBack.preview')} locale={locale}>
      {/* Heading */}
      <Heading style={heading}>
        {t('winBack.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('winBack.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('winBack.intro')}
      </Text>

      <Hr style={divider} />

      {/* Feature 1: Vitrine en ligne */}
      <Section style={featureBoxEmerald}>
        <Text style={featureBadgeEmerald}>{t('winBack.badgeNew')}</Text>
        <Text style={featureTitle}>{t('winBack.feature1Title')}</Text>
        <Text style={featureText}>{t('winBack.feature1Desc')}</Text>
      </Section>

      {/* Feature 2: Planning integre */}
      <Section style={featureBoxBlue}>
        <Text style={featureBadgeBlue}>{t('winBack.badgeNew')}</Text>
        <Text style={featureTitle}>{t('winBack.feature2Title')}</Text>
        <Text style={featureText}>{t('winBack.feature2Desc')}</Text>
      </Section>

      {/* Feature 3: Anniversaires auto */}
      <Section style={featureBoxViolet}>
        <Text style={featureBadgeViolet}>{t('winBack.badgeNew')}</Text>
        <Text style={featureTitle}>{t('winBack.feature3Title')}</Text>
        <Text style={featureText}>{t('winBack.feature3Desc')}</Text>
      </Section>

      <Hr style={divider} />

      {/* Social proof */}
      <Section style={socialProofBox}>
        <Text style={socialProofText}>{t('winBack.socialProof')}</Text>
      </Section>

      {/* Promo box */}
      <Section style={promoBox}>
        <Text style={promoTitle}>{t('winBack.promoTitle')}</Text>
        <Text style={promoPrice}>{t('winBack.promoPrice')}</Text>
        <Text style={promoLabel}>CODE PROMO</Text>
        <Text style={promoCodeStyled}>QARTEBOOST</Text>
      </Section>

      {/* CTA */}
      <Section style={buttonContainer}>
        <Button style={ctaButton} href="https://getqarte.com/dashboard/subscription">
          {t('winBack.cta')}
        </Button>
      </Section>

      {/* Reassurance */}
      <Text style={reassurance}>
        {t('winBack.reassurance')}
      </Text>

      <Text style={signature}>
        {t('winBack.signature')}
      </Text>
    </BaseLayout>
  );
}

// === STYLES ===

const heading = {
  color: '#1a1a1a',
  fontSize: '26px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '28px 0',
};

// Feature boxes
const featureBoxEmerald = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 12px 0',
  borderLeft: '4px solid #10b981',
};

const featureBoxBlue = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 12px 0',
  borderLeft: '4px solid #3b82f6',
};

const featureBoxViolet = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 12px 0',
  borderLeft: '4px solid #7c3aed',
};

const featureBadgeEmerald = {
  color: '#10b981',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 6px 0',
};

const featureBadgeBlue = {
  color: '#3b82f6',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 6px 0',
};

const featureBadgeViolet = {
  color: '#7c3aed',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 6px 0',
};

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 6px 0',
};

const featureText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

// Social proof
const socialProofBox = {
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
};

const socialProofText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  margin: '0',
};

// Promo
const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '16px',
  padding: '28px 24px',
  margin: '20px 0',
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
  fontSize: '22px',
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
  letterSpacing: '3px',
};

// CTA
const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
};

const ctaButton = {
  backgroundColor: '#4b0082',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '16px 40px',
};

const reassurance = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
  lineHeight: '1.5',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

export default WinBackEmail;
