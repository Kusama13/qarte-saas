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

interface QuickStartEmailProps {
  shopName: string;
  shopType?: string | null;
  locale?: EmailLocale;
}

export function QuickStartEmail({ shopName, shopType, locale = 'fr' }: QuickStartEmailProps) {
  const t = getEmailT(locale);
  const subtitle = shopType || t('quickStart.subtitleFallback');

  return (
    <BaseLayout preview={t('quickStart.preview', { shopName })} locale={locale}>
      <Heading style={heading}>{t('quickStart.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('quickStart.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('quickStart.intro')}</Text>

      {/* Mock preview de la vitrine — text-only, full border, sans rasterisation */}
      <Section style={previewCard}>
        <Text style={previewShopName}>{shopName}</Text>
        <Text style={previewSubtitle}>{subtitle}</Text>
        <Text style={previewStars}>★ ★ ★ ★ ★</Text>
        <Text style={previewDivider}>·  ·  ·</Text>
        <Text style={previewPlaceholder}>{t('quickStart.bioPlaceholder')}</Text>
      </Section>

      <Text style={paragraph}>{t('quickStart.benefit')}</Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/public-page">
          {t('quickStart.cta')}
        </Button>
      </Section>

      <Text style={footerNote}>{t('quickStart.footerNote')}</Text>

      <EmailSignoff>{t('quickStart.signature')}</EmailSignoff>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700' as const,
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const previewCard = {
  backgroundColor: '#fafafa',
  border: '1px solid #ececec',
  borderRadius: '14px',
  padding: '32px 24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const previewShopName = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: '700' as const,
  letterSpacing: '-0.01em',
  margin: '0 0 6px 0',
};

const previewSubtitle = {
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: '500' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 14px 0',
};

const previewStars = {
  color: '#f59e0b',
  fontSize: '15px',
  letterSpacing: '0.18em',
  margin: '0 0 18px 0',
};

const previewDivider = {
  color: '#cbd5e1',
  fontSize: '14px',
  letterSpacing: '0.4em',
  margin: '0 0 14px 0',
};

const previewPlaceholder = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0 16px 0',
};

const button = {
  backgroundColor: '#4b0082',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const footerNote = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

export default QuickStartEmail;
