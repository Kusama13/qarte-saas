import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface WelcomeEmailProps {
  shopName: string;
  trialDays?: number;
}

export function WelcomeEmail({ shopName, trialDays = 14 }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`Bienvenue sur Qarte, ${shopName} !`}>
      <Heading style={heading}>
        Bienvenue sur Qarte ! 🎉
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Merci d&apos;avoir créé votre compte Qarte. Votre essai gratuit de{' '}
        <strong>{trialDays} jours</strong> commence maintenant.
      </Text>

      <Section style={features}>
        <Text style={featureTitle}>Ce que vous pouvez faire :</Text>
        <Text style={featureItem}>✓ Créer votre programme de fidélité</Text>
        <Text style={featureItem}>✓ Générer votre QR code unique</Text>
        <Text style={featureItem}>✓ Suivre vos clients en temps réel</Text>
        <Text style={featureItem}>✓ Fidéliser sans application</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Accéder à mon espace
        </Button>
      </Section>

      <Text style={paragraph}>
        Des questions ? Répondez simplement à cet email, nous sommes là pour vous aider.
      </Text>

      <Text style={signature}>
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
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

const features = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const featureItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default WelcomeEmail;
