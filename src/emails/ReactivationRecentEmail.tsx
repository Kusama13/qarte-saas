import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import { getEmailT, type EmailLocale } from './translations';

interface ReactivationRecentEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

/** Réactivation — comptes récents (fin d'essai < ~6 semaines). Ton : check-in chaleureux. */
export function ReactivationRecentEmail({ shopName, locale = 'fr' }: ReactivationRecentEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('reactivationRecent.preview')} locale={locale}>
      <Heading style={heading}>{t('reactivationRecent.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('reactivationRecent.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('reactivationRecent.intro')}</Text>
      <Text style={paragraph}>{t('reactivationRecent.body')}</Text>

      <Section style={exampleBox}>
        <Text style={exampleText}>{t('reactivationRecent.exampleText')}</Text>
        <Button style={exampleButton} href="https://getqarte.com/exemples">
          {t('reactivationRecent.exampleCta')}
        </Button>
      </Section>

      <Section style={buttonContainer}>
        <Button style={ctaButton} href="https://getqarte.com/dashboard">
          {t('reactivationRecent.cta')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={momentumLabel}>{t('reactivationRecent.momentumTitle')}</Text>
      <Text style={momentumText}>{t('reactivationRecent.momentum')}</Text>

      <Text style={helpText}>{t('reactivationRecent.helpText')}</Text>

      <EmailSignoff>{t('reactivationRecent.signature')}</EmailSignoff>
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

const exampleBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const exampleText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const exampleButton = {
  backgroundColor: '#ffffff',
  border: '1px solid #d6c9f5',
  borderRadius: '8px',
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '10px 24px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
};

const ctaButton = {
  backgroundColor: '#4b0082',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '28px 0',
};

const momentumLabel = {
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const momentumText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const helpText = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

export default ReactivationRecentEmail;
