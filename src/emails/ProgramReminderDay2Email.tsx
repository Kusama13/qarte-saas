import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ProgramReminderDay2EmailProps {
  shopName: string;
  shopType: string;
}

const REWARD_IDEAS: Record<string, { reward: string; visits: string }> = {
  coiffeur: { reward: '1 brushing offert', visits: '8 visites' },
  barbier: { reward: '1 coupe offerte', visits: '8 visites' },
  onglerie: { reward: '1 pose semi-permanent offerte', visits: '10 passages' },
  institut_beaute: { reward: '1 soin visage offert', visits: '10 séances' },
  spa: { reward: '1 soin visage offert', visits: '10 séances' },
  estheticienne: { reward: '1 séance offerte', visits: '10 rendez-vous' },
  epilation: { reward: '1 séance offerte', visits: '10 rendez-vous' },
  restaurant: { reward: '1 dessert offert', visits: '5 repas' },
  boulangerie: { reward: '1 viennoiserie offerte', visits: '8 passages' },
  cafe: { reward: '1 boisson offerte', visits: '8 passages' },
};

const DEFAULT_REWARD = { reward: '1 prestation offerte', visits: '10 passages' };

export function ProgramReminderDay2Email({ shopName, shopType }: ProgramReminderDay2EmailProps) {
  const normalizedType = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const suggestion = REWARD_IDEAS[normalizedType] || DEFAULT_REWARD;

  return (
    <BaseLayout preview={`${shopName}, on a trouvé la récompense idéale pour votre activité`}>
      <Heading style={heading}>
        Quelle récompense choisir ? On a la réponse.
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Vous hésitez sur la récompense à proposer ? C&apos;est la question n°1
        que nous recevons. On a fait le travail pour vous.
      </Text>

      <Section style={recommendationBox}>
        <Text style={recommendationLabel}>Notre recommandation pour votre activité :</Text>
        <Text style={recommendationText}>
          &quot;<strong>{suggestion.reward}</strong> après <strong>{suggestion.visits}</strong>&quot;
        </Text>
        <Text style={recommendationNote}>
          Simple, vos clients comprennent tout de suite.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Choisir ma récompense en 1 clic
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        Vous pourrez modifier votre récompense à tout moment. L&apos;important,
        c&apos;est de démarrer — chaque jour sans programme, ce sont des clients
        qui repartent sans être fidélisés.
      </Text>

      <Section style={tipBox}>
        <Text style={tipTitle}>Le saviez-vous ?</Text>
        <Text style={tipText}>
          Les commerçants qui lancent leur programme dans les 48h après
          inscription ont <strong>3x plus de scans</strong> le premier mois.
        </Text>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Répondez à cet email ou contactez-nous sur WhatsApp.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20choisir%20ma%20r%C3%A9compense%20Qarte">
          Nous contacter sur WhatsApp
        </Button>
      </Section>

      <Text style={signature}>
        L&apos;équipe Qarte
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
  border: '2px solid #654EDA',
  textAlign: 'center' as const,
};

const recommendationLabel = {
  color: '#654EDA',
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

const recommendationNote = {
  color: '#6b7280',
  fontSize: '14px',
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
  backgroundColor: '#654EDA',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
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

export default ProgramReminderDay2Email;
