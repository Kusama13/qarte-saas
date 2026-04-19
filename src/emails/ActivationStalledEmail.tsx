import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ActivationStalledEmailProps {
  shopName: string;
  shopType?: string | null;
  locale?: EmailLocale;
}

/**
 * Email S0 J+3 — merchant activation stalled (0/3 piliers).
 * Plan v2 emails+SMS §3 Email 8.
 * Remplace ProgramReminderDay2/3, SocialProof, FirstClientScript.
 */
export function ActivationStalledEmail({ shopName, shopType, locale = 'fr' }: ActivationStalledEmailProps) {
  const t = getEmailT(locale);
  const pathKey = getQuickPathKey(shopType);

  return (
    <BaseLayout preview={t('activationStalled.preview', { shopName })} locale={locale}>
      <Heading style={heading}>{t('activationStalled.heading', { shopName })}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('activationStalled.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('activationStalled.intro')}</Text>

      <Section style={caseStudyBox}>
        <Text style={caseStudyTitle}>{t('activationStalled.caseStudyTitle')}</Text>
        <Text style={caseStudyItem}>{t('activationStalled.caseStudy1')}</Text>
        <Text style={caseStudyItem}>{t('activationStalled.caseStudy2')}</Text>
        <Text style={caseStudyItem}>{t('activationStalled.caseStudy3')}</Text>
      </Section>

      <Text style={paragraph}>{t('activationStalled.pathIntro')}</Text>

      <Section style={pathBox}>
        <Text style={pathTitle}>{t(`activationStalled.path.${pathKey}.title`)}</Text>
        <Text style={pathStep}>1. {t(`activationStalled.path.${pathKey}.step1`)}</Text>
        <Text style={pathStep}>2. {t(`activationStalled.path.${pathKey}.step2`)}</Text>
        <Text style={pathStep}>3. {t(`activationStalled.path.${pathKey}.step3`)}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('activationStalled.cta')}
        </Button>
      </Section>

      <Text style={paragraph}>{t('activationStalled.help')}</Text>

      <Text style={signature}>{t('activationStalled.signature')}</Text>
    </BaseLayout>
  );
}

function getQuickPathKey(shopType: string | null | undefined): 'fidelity' | 'planning' | 'vitrine' {
  // Mapping simple : par défaut on pousse la fidélité (ROI plus rapide pour TPE beauté)
  if (shopType === 'barber' || shopType === 'hairdresser') return 'fidelity';
  if (shopType === 'spa' || shopType === 'institute') return 'planning';
  return 'fidelity';
}

const heading = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', lineHeight: '1.3', margin: '0 0 24px 0' };
const paragraph = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px 0' };
const caseStudyBox = { backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px 24px', margin: '24px 0' };
const caseStudyTitle = { color: '#1a1a1a', fontSize: '13px', fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px 0' };
const caseStudyItem = { color: '#4a5568', fontSize: '14px', lineHeight: '1.6', margin: '0 0 6px 0' };
const pathBox = { backgroundColor: '#faf5ff', borderRadius: '12px', padding: '20px 24px', margin: '24px 0', borderLeft: '4px solid #7c3aed' };
const pathTitle = { color: '#1a1a1a', fontSize: '17px', fontWeight: '700' as const, margin: '0 0 12px 0' };
const pathStep = { color: '#4a5568', fontSize: '14px', lineHeight: '1.8', margin: '0 0 4px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = { backgroundColor: '#4b0082', borderRadius: '8px', color: '#ffffff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, padding: '14px 32px' };
const signature = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '24px 0 0 0' };

export default ActivationStalledEmail;
