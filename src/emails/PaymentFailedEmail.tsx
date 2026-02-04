import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface PaymentFailedEmailProps {
  shopName: string;
}

export function PaymentFailedEmail({ shopName }: PaymentFailedEmailProps) {
  return (
    <BaseLayout preview={`${shopName} - Action requise : problème de paiement`}>
      <Heading style={heading}>
        Problème avec votre paiement
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Nous n&apos;avons pas pu traiter votre dernier paiement pour votre abonnement Qarte.
      </Text>

      <Section style={warningBox}>
        <Text style={warningTitle}>Pourquoi ce problème ?</Text>
        <Text style={warningText}>
          Cela peut arriver si votre carte a expiré, si les fonds sont insuffisants,
          ou si votre banque a bloqué la transaction.
        </Text>
      </Section>

      <Section style={impactSection}>
        <Text style={impactTitle}>Ce qui va se passer :</Text>
        <Text style={impactItem}>• Nous réessaierons automatiquement dans quelques jours</Text>
        <Text style={impactItem}>• Si le paiement échoue à nouveau, votre compte sera suspendu</Text>
        <Text style={impactItem}>• Vos clients ne pourront plus valider leurs passages</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          Mettre à jour mon moyen de paiement
        </Button>
      </Section>

      <Text style={paragraph}>
        Si vous avez des questions ou besoin d&apos;aide, n&apos;hésitez pas à nous contacter.
      </Text>

      <Text style={signature}>
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#f59e0b',
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

const warningBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #fde68a',
};

const warningTitle = {
  color: '#b45309',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const warningText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
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
  backgroundColor: '#f59e0b',
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

export default PaymentFailedEmail;
