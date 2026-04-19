import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface InactiveMerchantDay30EmailProps {
  shopName: string;
  /** Plan tier : change l'option 2 (fidelity = "30 min founder" / all_in = "downgrade Fidélité") */
  planTier?: 'fidelity' | 'all_in';
  locale?: EmailLocale;
}

/**
 * Refonte plan v2 §F : pratfall + 3 options concrètes (pause / switch / call).
 * Skill churn-prevention §"Save Offer Types" : 60-80% des pausers réactivent.
 */
export function InactiveMerchantDay30Email({ shopName, planTier = 'all_in', locale = 'fr' }: InactiveMerchantDay30EmailProps) {
  const t = getEmailT(locale);
  const option2Title = planTier === 'all_in' ? t('inactiveDay30.option2TitleAllIn') : t('inactiveDay30.option2TitleFidelity');
  const option2Desc = planTier === 'all_in' ? t('inactiveDay30.option2DescAllIn') : t('inactiveDay30.option2DescFidelity');

  return (
    <BaseLayout preview={t('inactiveDay30.preview')} locale={locale}>
      <Heading style={heading}>
        {t('inactiveDay30.heading', { shopName })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('inactiveDay30.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('inactiveDay30.intro')}
      </Text>

      <Section style={optionsTitleBox}>
        <Text style={optionsTitle}>{t('inactiveDay30.optionsTitle')}</Text>
      </Section>

      <Section style={optionBox}>
        <Text style={optionTitle}>{t('inactiveDay30.option1Title')}</Text>
        <Text style={optionDesc}>{t('inactiveDay30.option1Desc')}</Text>
      </Section>

      <Section style={optionBox}>
        <Text style={optionTitle}>{option2Title}</Text>
        <Text style={optionDesc}>{option2Desc}</Text>
      </Section>

      <Section style={optionBox}>
        <Text style={optionTitle}>{t('inactiveDay30.option3Title')}</Text>
        <Text style={optionDesc}>{t('inactiveDay30.option3Desc')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('inactiveDay30.cta')}
        </Button>
      </Section>

      <Text style={paragraph}>
        {t('inactiveDay30.helpText')}
      </Text>

      <Text style={signatureBlock}>
        {t('inactiveDay30.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '22px',
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

const optionsTitleBox = { margin: '28px 0 12px 0' };
const optionsTitle = { color: '#1a1a1a', fontSize: '14px', fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0' };
const optionBox = { backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px 20px', margin: '0 0 10px 0', borderLeft: '4px solid #7c3aed' };
const optionTitle = { color: '#1a1a1a', fontSize: '16px', fontWeight: '700' as const, margin: '0 0 6px 0' };
const optionDesc = { color: '#4a5568', fontSize: '14px', lineHeight: '1.5', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '28px 0 16px 0' };
const button = { backgroundColor: '#4b0082', borderRadius: '8px', color: '#ffffff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, padding: '14px 32px' };

const signatureBlock = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default InactiveMerchantDay30Email;
