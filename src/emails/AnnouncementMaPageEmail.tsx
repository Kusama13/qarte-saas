import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface AnnouncementMaPageEmailProps {
  shopName: string;
  slug: string;
  isSubscribed?: boolean;
  locale?: EmailLocale;
}

export function AnnouncementMaPageEmail({ shopName, slug, isSubscribed = true, locale = 'fr' }: AnnouncementMaPageEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('announcementMaPage.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('announcementMaPage.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('announcementMaPage.greeting', { shopName }) }} />

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('announcementMaPage.intro') }} />

      {/* 1. Ma Page */}
      <Section style={featureBoxViolet}>
        <Text style={featureBadgeViolet}>{t('announcementMaPage.badgeNew')}</Text>
        <Text style={featureTitle}>{t('announcementMaPage.feature1Title')}</Text>
        <Text style={featureText}>
          {t('announcementMaPage.feature1Desc')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonViolet} href={`https://getqarte.com/p/${slug}`}>
          {t('announcementMaPage.feature1Cta')}
        </Button>
      </Section>

      {/* 2. Offre de bienvenue */}
      <Section style={featureBoxBlue}>
        <Text style={featureBadgeBlue}>{t('announcementMaPage.badgeAcquisition')}</Text>
        <Text style={featureTitle}>{t('announcementMaPage.feature2Title')}</Text>
        <Text style={featureText}>
          {t('announcementMaPage.feature2Desc')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonBlue} href="https://getqarte.com/dashboard/referrals">
          {t('announcementMaPage.feature2Cta')}
        </Button>
      </Section>

      {/* Résumé */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>{t('announcementMaPage.summaryTitle')}</Text>
        <Text style={summaryText}>
          {t('announcementMaPage.summaryText')}
        </Text>
      </Section>

      {/* Section non-abonnés */}
      {!isSubscribed && (
        <Section style={resubscribeBox}>
          <Text style={resubscribeTitle}>{t('announcementMaPage.resubscribeTitle')}</Text>
          <Text style={resubscribeText}>
            {t('announcementMaPage.resubscribeText')}
          </Text>
          <Section style={buttonContainer}>
            <Button style={buttonGreen} href="https://getqarte.com/dashboard/subscription">
              {t('announcementMaPage.resubscribeCta')}
            </Button>
          </Section>
        </Section>
      )}

      <Text style={signature}>
        {t('announcementMaPage.signature')}
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

const featureBadgeViolet = {
  color: '#7c3aed',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const featureBadgeBlue = {
  color: '#3b82f6',
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

const buttonGreen = {
  backgroundColor: '#059669',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const summaryBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const summaryTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const summaryText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const resubscribeBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
  border: '1px solid #a7f3d0',
};

const resubscribeTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const resubscribeText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 4px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default AnnouncementMaPageEmail;
