import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface SubscriptionCanceledEmailProps {
  shopName: string;
  endDate: string;
}

export function SubscriptionCanceledEmail({ shopName, endDate }: SubscriptionCanceledEmailProps) {
  return (
    <BaseLayout preview={`${shopName} - Confirmation de résiliation`}>
      <Heading style={heading}>
        Votre abonnement a été résilié
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Nous confirmons la résiliation de votre abonnement Qarte.
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>Récapitulatif</Text>
        <Text style={infoText}>
          Votre accès prendra fin le <strong>{endDate}</strong>.
        </Text>
        <Text style={infoText}>
          Après cette date, votre compte sera suspendu et vos clients ne pourront plus
          valider leurs passages.
        </Text>
      </Section>

      <Section style={dataSection}>
        <Text style={dataTitle}>Vos données</Text>
        <Text style={dataText}>
          Conformément au RGPD, vos données seront conservées pendant 30 jours après la fin
          de votre abonnement. Passé ce délai, elles seront définitivement supprimées.
        </Text>
        <Text style={dataText}>
          Si vous souhaitez récupérer vos données ou demander leur suppression anticipée,
          contactez-nous à support@getqarte.com.
        </Text>
      </Section>

      <Text style={paragraph}>
        Nous sommes tristes de vous voir partir. Si vous changez d&apos;avis, vous pouvez
        réactiver votre compte à tout moment.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          Réactiver mon abonnement
        </Button>
      </Section>

      <Text style={feedbackText}>
        Votre avis compte ! Pourriez-vous nous dire pourquoi vous avez décidé de partir ?
        Répondez simplement à cet email, cela nous aidera à améliorer Qarte.
      </Text>

      <Text style={signature}>
        Merci d&apos;avoir utilisé Qarte,
        <br />
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#6b7280',
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

const infoBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const infoTitle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const dataSection = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const dataTitle = {
  color: '#7c3aed',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const dataText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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

const feedbackText = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0',
  fontStyle: 'italic' as const,
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default SubscriptionCanceledEmail;
