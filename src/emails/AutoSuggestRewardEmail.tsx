import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface AutoSuggestRewardEmailProps {
  shopName: string;
  shopType: string;
  daysRemaining: number;
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

export function AutoSuggestRewardEmail({ shopName, shopType, daysRemaining }: AutoSuggestRewardEmailProps) {
  const normalizedType = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const suggestion = REWARD_IDEAS[normalizedType] || DEFAULT_REWARD;

  return (
    <BaseLayout preview={`${shopName}, on a choisi la meilleure récompense pour vous — 1 clic pour activer`}>
      <Heading style={heading}>
        On a choisi la meilleure r&eacute;compense pour vous
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Cela fait 5 jours que votre compte est cr&eacute;&eacute;. On sait que choisir
        une r&eacute;compense peut &ecirc;tre un blocage &mdash; alors on l&apos;a fait pour vous.
      </Text>

      <Section style={recommendationBox}>
        <Text style={recommendationLabel}>R&eacute;compense recommand&eacute;e pour votre activit&eacute; :</Text>
        <Text style={recommendationText}>
          &quot;<strong>{suggestion.reward}</strong> apr&egrave;s <strong>{suggestion.visits}</strong>&quot;
        </Text>
        <Text style={recommendationNote}>
          Cliquez ci-dessous et elle sera configur&eacute;e automatiquement.
          Vous pourrez la modifier &agrave; tout moment.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Activer cette r&eacute;compense en 1 clic
        </Button>
      </Section>

      {daysRemaining > 0 && (
        <Section style={urgencyBox}>
          <Text style={urgencyText}>
            Il vous reste <strong>{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</strong> d&apos;essai gratuit.
            Chaque jour sans programme = des clients qui repartent sans raison de revenir.
          </Text>
        </Section>
      )}

      <Hr style={divider} />

      <Text style={paragraph}>
        Vous pr&eacute;f&eacute;rez qu&apos;on le fasse pour vous ? R&eacute;pondez &agrave; cet email
        avec votre r&eacute;compense souhait&eacute;e, ou contactez-nous sur WhatsApp :
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20pouvez-vous%20configurer%20mon%20programme%20Qarte%20pour%20moi%20%3F">
          WhatsApp : on configure pour vous
        </Button>
      </Section>

      <Text style={signature}>
        L&apos;&eacute;quipe Qarte
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

const whatsappButton = {
  backgroundColor: '#25D366',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default AutoSuggestRewardEmail;
