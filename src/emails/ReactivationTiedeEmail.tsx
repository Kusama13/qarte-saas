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

interface ReactivationTiedeEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

/** Réactivation — comptes tièdes (~6 semaines à 4 mois). Ton : conseil de pro à pro, value-first. */
export function ReactivationTiedeEmail({ shopName, locale = 'fr' }: ReactivationTiedeEmailProps) {
  const t = getEmailT(locale);

  const tips = [
    t('reactivationTiede.tip1'),
    t('reactivationTiede.tip2'),
    t('reactivationTiede.tip3'),
  ];

  return (
    <BaseLayout preview={t('reactivationTiede.preview')} locale={locale}>
      <Heading style={heading}>{t('reactivationTiede.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('reactivationTiede.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('reactivationTiede.intro')}</Text>
      <Text style={paragraph}>{t('reactivationTiede.body')}</Text>

      <Section style={tipsBox}>
        {tips.map((tip, i) => (
          <Text key={i} style={tipItem}>
            <span style={tipNumber}>{i + 1}</span>
            {tip}
          </Text>
        ))}
      </Section>

      <Text style={paragraph}>{t('reactivationTiede.guideText')}</Text>

      <Section style={buttonContainer}>
        <Button style={ctaButton} href="https://getqarte.com/blog/comment-attirer-clientes-salon-beaute">
          {t('reactivationTiede.guideCta')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={momentumText}>{t('reactivationTiede.momentum')}</Text>

      <EmailSignoff>{t('reactivationTiede.signature')}</EmailSignoff>
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

const tipsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const tipItem = {
  color: '#1a1a1a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const tipNumber = {
  display: 'inline-block' as const,
  width: '22px',
  height: '22px',
  backgroundColor: '#4b0082',
  color: '#ffffff',
  borderRadius: '11px',
  textAlign: 'center' as const,
  fontSize: '13px',
  fontWeight: '700',
  lineHeight: '22px',
  marginRight: '10px',
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

const momentumText = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

export default ReactivationTiedeEmail;
