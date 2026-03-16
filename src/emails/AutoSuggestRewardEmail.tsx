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

interface AutoSuggestRewardEmailProps {
  shopName: string;
  shopType: string;
  daysRemaining: number;
  locale?: EmailLocale;
}

const REWARD_KEYS: Record<string, string> = {
  coiffeur: 'coiffeur',
  barbier: 'barbier',
  onglerie: 'onglerie',
  institut_beaute: 'institutBeaute',
  spa: 'spa',
  estheticienne: 'estheticienne',
  tatouage: 'tatouage',
  restaurant: 'restaurant',
  boulangerie: 'boulangerie',
  cafe: 'cafe',
};

function getRewardIdea(t: ReturnType<typeof getEmailT>, shopType: string) {
  const normalized = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const key = REWARD_KEYS[normalized] || 'default';
  return {
    reward: t(`rewardIdeas.${key}Reward`),
    visits: t(`rewardIdeas.${key}Visits`),
  };
}

export function AutoSuggestRewardEmail({ shopName, shopType, daysRemaining, locale = 'fr' }: AutoSuggestRewardEmailProps) {
  const t = getEmailT(locale);
  const suggestion = getRewardIdea(t, shopType);

  return (
    <BaseLayout preview={t('autoSuggestReward.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('autoSuggestReward.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('autoSuggestReward.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('autoSuggestReward.intro')}
      </Text>

      <Section style={recommendationBox}>
        <Text style={recommendationLabel}>{t('autoSuggestReward.recommendationLabel')}</Text>
        <Text style={recommendationText}>
          &quot;<strong>{suggestion.reward}</strong> {t('autoSuggestReward.afterVisits')} <strong>{suggestion.visits}</strong>&quot;
        </Text>
        <Text style={recommendationNote}>
          {t('autoSuggestReward.recommendationNote')}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          {t('autoSuggestReward.ctaSetup')}
        </Button>
      </Section>

      {daysRemaining > 0 && (
        <Section style={urgencyBox}>
          <Text style={urgencyText} dangerouslySetInnerHTML={{ __html: t('autoSuggestReward.trialNote', { daysRemaining: String(daysRemaining), daysPlural: daysRemaining > 1 ? 's' : '' }) }} />
        </Section>
      )}

      <Hr style={divider} />

      <Text style={paragraph}>
        {t('autoSuggestReward.helpLine')}
      </Text>

      <Text style={signature}>
        {t('autoSuggestReward.signature')}
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
  margin: '0 0 12px 0',
};

const recommendationNote = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const urgencyBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const urgencyText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
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

export default AutoSuggestRewardEmail;
