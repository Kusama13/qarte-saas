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

export function AutoSuggestRewardEmail({ shopName, shopType, daysRemaining, locale = 'fr' }: AutoSuggestRewardEmailProps) {
  const t = getEmailT(locale);
  const normalizedType = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const suggestion = REWARD_IDEAS[normalizedType] || DEFAULT_REWARD;

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
        <Text style={recommendationLabel}>R&eacute;compense recommand&eacute;e pour ton activit&eacute; :</Text>
        <Text style={recommendationText}>
          &quot;<strong>{suggestion.reward}</strong> après <strong>{suggestion.visits}</strong>&quot;
        </Text>
        <Text style={recommendationNote}>
          Clique ci-dessous pour la configurer.
          Tu pourras la modifier &agrave; tout moment.
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
        Tu pr&eacute;f&egrave;res qu&apos;on le fasse pour toi ? R&eacute;ponds &agrave; cet email.
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
