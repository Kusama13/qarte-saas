import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ProgramReminderDay3EmailProps {
  shopName: string;
  daysRemaining: number;
}

export function ProgramReminderDay3Email({ shopName, daysRemaining }: ProgramReminderDay3EmailProps) {
  return (
    <BaseLayout preview={`${shopName}, il vous reste ${daysRemaining} jours d'essai — configurez votre programme`}>
      <Heading style={heading}>
        Votre programme attend toujours
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre compte a été créé il y a 3 jours. Configurer votre programme
        prend 3 minutes et votre QR code sera prêt immédiatement.
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Il vous reste <strong>{daysRemaining} jours</strong> d&apos;essai gratuit.
        </Text>
      </Section>

      <Section style={optionBox}>
        <Text style={optionLabel}>Faites-le vous-même (3 min)</Text>
        <Text style={optionDescription}>
          Choisissez votre récompense et votre programme est en ligne.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href="https://getqarte.com/dashboard/program">
            Configurer maintenant
          </Button>
        </Section>
      </Section>

      <Section style={optionBox}>
        <Text style={optionLabel}>On le fait pour vous</Text>
        <Text style={optionDescription}>
          Répondez à cet email avec votre récompense (ex: &quot;1 brushing offert après 8 visites&quot;)
          et on configure tout.
        </Text>
      </Section>

      <Section style={challengeBox}>
        <Text style={challengeTitle}>5 clients en 3 jours = premier mois à 9€</Text>
        <Text style={challengeText}>
          Configurez votre programme, faites scanner <strong>5 clients en 3 jours</strong>,
          et obtenez votre <strong>premier mois à 9€</strong> au lieu de 19€.
        </Text>
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

const optionBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 16px 0',
};

const optionLabel = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const optionDescription = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0 0 0',
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

const challengeBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '28px 0',
  border: '2px solid #f59e0b',
};

const challengeTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const challengeText = {
  color: '#78350f',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ProgramReminderDay3Email;
