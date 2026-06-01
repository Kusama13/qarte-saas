import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import { getEmailT, type EmailLocale } from './translations';

interface ReactivationAncienEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

/** Réactivation — comptes anciens (4 mois +). Ton : reconquête honnête, "what's new" + preuve sociale. */
export function ReactivationAncienEmail({ shopName, locale = 'fr' }: ReactivationAncienEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('reactivationAncien.preview')} locale={locale}>
      <Heading style={heading}>{t('reactivationAncien.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('reactivationAncien.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('reactivationAncien.intro')}</Text>

      <Section style={pointBox}>
        <Text style={pointTitle}>{t('reactivationAncien.point1Title')}</Text>
        <Text style={pointText}>{t('reactivationAncien.point1Text')}</Text>
      </Section>

      <Section style={pointBox}>
        <Text style={pointTitle}>{t('reactivationAncien.point2Title')}</Text>
        <Text style={pointText}>{t('reactivationAncien.point2Text')}</Text>
      </Section>

      <Text style={paragraph}>{t('reactivationAncien.body')}</Text>

      <Section style={buttonContainer}>
        <Button style={ctaButton} href="https://getqarte.com/exemples">
          {t('reactivationAncien.cta')}
        </Button>
      </Section>

      <Text style={reassurance}>{t('reactivationAncien.reassurance')}</Text>

      <EmailSignoff>{t('reactivationAncien.signature')}</EmailSignoff>
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

const pointBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 12px 0',
};

const pointTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 6px 0',
};

const pointText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
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

const reassurance = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
  lineHeight: '1.5',
};

export default ReactivationAncienEmail;
