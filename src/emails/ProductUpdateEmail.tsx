import {
  Button,
  Heading,
  Text,
  Section,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ProductUpdateEmailProps {
  shopName: string;
  merchantId: string;
  referralCode?: string;
  locale?: EmailLocale;
}

export function ProductUpdateEmail({ shopName, merchantId, referralCode, locale = 'fr' }: ProductUpdateEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('productUpdate.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('productUpdate.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('productUpdate.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('productUpdate.introBody')}
      </Text>

      {/* 1. Referral */}
      <Section style={featureBoxViolet}>
        <Text style={featureBadgeViolet}>{t('productUpdate.badgeNew')}</Text>
        <Text style={featureTitle}>{t('productUpdate.feature1Title')}</Text>
        <Text style={featureText}>
          {t('productUpdate.feature1Desc')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonViolet} href="https://getqarte.com/dashboard/program?section=referral">
          {t('productUpdate.feature1Cta')}
        </Button>
      </Section>

      {/* 2. Social media */}
      <Section style={featureBoxBlue}>
        <Text style={featureTitle}>{t('productUpdate.feature2Title')}</Text>
        <Text style={featureText}>
          {t('productUpdate.feature2Desc')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonBlue} href="https://getqarte.com/dashboard/public-page">
          {t('productUpdate.feature2Cta')}
        </Button>
      </Section>

      {/* 3. New design */}
      <Section style={featureBoxIndigo}>
        <Text style={featureBadgeIndigo}>{t('productUpdate.badgeNew')}</Text>
        <Text style={featureTitle}>{t('productUpdate.feature3Title')}</Text>
        <Text style={featureText}>
          {t('productUpdate.feature3Desc')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonIndigo} href={`https://getqarte.com/customer/card/${merchantId}?preview=true`}>
          {t('productUpdate.feature3Cta')}
        </Button>
      </Section>

      {/* 4. Blog */}
      <Section style={blogBox}>
        <Text style={blogLabel}>{t('productUpdate.blogLabel')}</Text>
        <Text style={blogTitle}>
          {t('productUpdate.blogTitle')}
        </Text>
        <Text style={blogText}>
          {t('productUpdate.blogDesc')}
        </Text>
        <Link href="https://getqarte.com/blog/logiciel-reservation-en-ligne-salon-beaute" style={blogLink}>
          {t('productUpdate.blogLink')}
        </Link>
      </Section>

      {/* 5. Merchant referral */}
      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitle}>{t('productUpdate.referralTitle')}</Text>
          <Text style={referralText} dangerouslySetInnerHTML={{ __html: t('productUpdate.referralText') }} />
          <Text style={referralCodeStyle} dangerouslySetInnerHTML={{ __html: t('productUpdate.referralCodeLabel', { referralCode }) }} />
          <Text style={referralHint}>
            {t('productUpdate.referralHint')}
          </Text>
        </Section>
      )}

      <Text style={signature}>
        {t('productUpdate.signature')}
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

const featureBoxViolet = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #7c3aed',
};

const featureBoxBlue = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #3b82f6',
};

const featureBoxIndigo = {
  backgroundColor: '#eef2ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #6366f1',
};

const featureBadgeViolet = {
  color: '#7c3aed',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const featureBadgeIndigo = {
  color: '#6366f1',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const featureText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0 28px 0',
};

const buttonViolet = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const buttonBlue = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const buttonIndigo = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const blogBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const blogLabel = {
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const blogTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  lineHeight: '1.4',
  margin: '0 0 6px 0',
};

const blogText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const blogLink = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
};

const referralBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const referralTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const referralText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const referralCodeStyle = {
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

const referralHint = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ProductUpdateEmail;
