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

interface FirstClientScriptEmailProps {
  shopName: string;
  shopType: string;
  rewardDescription: string;
  stampsRequired: number;
  loyaltyMode?: 'visit' | 'cagnotte';
  locale?: EmailLocale;
}

const SCRIPTS: Record<string, string> = {
  coiffeur: "C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes",
  barbier: "C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes",
  onglerie: "Pendant que le vernis sèche, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
  institut_beaute: "Pendant qu'on pose le masque, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
  spa: "Avant de repartir, scannez le QR code pour votre carte de fidélité — ça prend 5 secondes",
  estheticienne: "Pendant la pause, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
  tatouage: "Pendant la consultation, proposez à vos clients de scanner le QR code pour la carte de fidélité — ça prend 5 secondes",
};

const DEFAULT_SCRIPT = "Avant de partir, scannez le QR code pour la carte de fidélité — 5 secondes et c'est fait";

export function FirstClientScriptEmail({ shopName, shopType, rewardDescription, stampsRequired, loyaltyMode = 'visit', locale = 'fr' }: FirstClientScriptEmailProps) {
  const t = getEmailT(locale);
  const normalized = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const script = SCRIPTS[normalized] || DEFAULT_SCRIPT;

  return (
    <BaseLayout preview={t('firstClientScript.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('firstClientScript.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('firstClientScript.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('firstClientScript.intro')}
      </Text>

      <Section style={scriptBox}>
        <Text style={scriptLabel}>{t('firstClientScript.scriptTitle')}</Text>
        <Text style={scriptText}>
          &quot;{script} — apr&egrave;s <strong>{stampsRequired} passages</strong> c&apos;est{' '}
          <strong>{rewardDescription}</strong>{loyaltyMode === 'cagnotte' ? ' sur leurs d\u00e9penses' : ''}.&quot;
        </Text>
      </Section>

      <Section style={tipsBox}>
        <Text style={tipsTitle}>{t('firstClientScript.tipsTitle')}</Text>
        <Text style={tipItem}>{t('firstClientScript.tip1')}</Text>
        <Text style={tipItem}>{t('firstClientScript.tip2')}</Text>
        <Text style={tipItem}>{t('firstClientScript.tip3')}</Text>
      </Section>

      <Hr style={divider} />

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('firstClientScript.ctaDashboard')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('firstClientScript.signature')}
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

const scriptBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #4b0082',
  textAlign: 'center' as const,
};

const scriptLabel = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
};

const scriptText = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '0',
  fontStyle: 'italic' as const,
};

const tipsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const tipsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const tipItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
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

export default FirstClientScriptEmail;
