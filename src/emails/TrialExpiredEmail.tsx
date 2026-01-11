import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface TrialExpiredEmailProps {
  shopName: string;
  daysUntilDeletion: number;
}

export function TrialExpiredEmail({ shopName, daysUntilDeletion }: TrialExpiredEmailProps) {
  return (
    <BaseLayout preview={`Urgent : Vos données seront supprimées dans ${daysUntilDeletion} jours`}>
      <Heading style={heading}>
        ⚠️ Votre essai a expiré
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre période d&apos;essai Qarte est terminée. Votre compte est actuellement suspendu.
      </Text>

      <Section style={urgentBox}>
        <Text style={urgentTitle}>🗑️ Suppression des données</Text>
        <Text style={urgentText}>
          Vos données clients seront <strong>définitivement supprimées</strong> dans{' '}
          <strong style={countdown}>{daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''}</strong>.
        </Text>
      </Section>

      <Section style={impactSection}>
        <Text style={impactTitle}>Ce qui est impacté :</Text>
        <Text style={impactItem}>✗ Vos clients ne peuvent plus valider leurs passages</Text>
        <Text style={impactItem}>✗ Votre QR code est désactivé</Text>
        <Text style={impactItem}>✗ Votre historique sera supprimé</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          Réactiver mon compte - 19€/mois
        </Button>
      </Section>

      <Text style={paragraph}>
        En souscrivant maintenant, vous retrouverez immédiatement accès à toutes vos données et fonctionnalités.
      </Text>

      <Text style={signature}>
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#dc2626',
  fontSize: '24px',
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

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #fecaca',
};

const urgentTitle = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const urgentText = {
  color: '#7f1d1d',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const countdown = {
  color: '#dc2626',
  fontSize: '18px',
};

const impactSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const impactTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const impactItem = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
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

export default TrialExpiredEmail;
