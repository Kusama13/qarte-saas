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

interface ProgramReminderDay2EmailProps {
  shopName: string;
  shopType: string;
  slug?: string;
  locale?: EmailLocale;
}

const REWARD_IDEAS: Record<string, { reward: string; visits: string }> = {
  coiffeur: { reward: '1 brushing offert', visits: '8 visites' },
  barbier: { reward: '1 coupe offerte', visits: '8 visites' },
  onglerie: { reward: '1 pose semi-permanent offerte', visits: '10 passages' },
  institut_beaute: { reward: '1 soin visage offert', visits: '10 séances' },
  spa: { reward: '1 soin visage offert', visits: '10 séances' },
  estheticienne: { reward: '1 séance offerte', visits: '10 rendez-vous' },
  tatouage: { reward: '1 retouche offerte', visits: '8 séances' },
  restaurant: { reward: '1 dessert offert', visits: '5 repas' },
  boulangerie: { reward: '1 viennoiserie offerte', visits: '8 passages' },
  cafe: { reward: '1 boisson offerte', visits: '8 passages' },
};

const DEFAULT_REWARD = { reward: '1 prestation offerte', visits: '10 passages' };

export function ProgramReminderDay2Email({ shopName, shopType, slug, locale = 'fr' }: ProgramReminderDay2EmailProps) {
  const t = getEmailT(locale);
  const normalizedType = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const suggestion = REWARD_IDEAS[normalizedType] || DEFAULT_REWARD;
  const publicPageUrl = slug ? `https://getqarte.com/p/${slug}` : null;

  return (
    <BaseLayout preview={t('programReminderDay2.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('programReminderDay2.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('programReminderDay2.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('programReminderDay2.intro')}
      </Text>

      <Section style={recommendationBox}>
        <Text style={recommendationLabel}>{t('programReminderDay2.suggestionTitle')}</Text>
        <Text style={recommendationText}>
          &quot;<strong>{suggestion.reward}</strong> après <strong>{suggestion.visits}</strong>&quot;
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          {t('programReminderDay2.ctaSetup')}
        </Button>
      </Section>

      <Hr style={divider} />

      {publicPageUrl && (
        <>
          <Section style={buttonContainer}>
            <Button style={buttonSecondary} href={publicPageUrl}>
              {t('programReminderDay2.ctaPublicPage')}
            </Button>
          </Section>

          <Hr style={divider} />
        </>
      )}

      <Text style={paragraph}>
        {t('programReminderDay2.helpText')}
      </Text>

      <Text style={signature}>
        {t('programReminderDay2.signature')}
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

const recommendationBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #4b0082',
  textAlign: 'center' as const,
};

const recommendationLabel = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
};

const recommendationText = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 8px 0',
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

const buttonSecondary = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const tipBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const tipTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const tipText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ProgramReminderDay2Email;
