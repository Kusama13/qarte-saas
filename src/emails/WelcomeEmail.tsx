import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface WelcomeEmailProps {
  shopName: string;
  trialDays?: number;
}

export function WelcomeEmail({ shopName, trialDays = 7 }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, votre programme de fidélité est prêt en 3 minutes`}>
      <Heading style={heading}>
        Bienvenue {shopName} !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre compte Qarte est créé. Vous avez <strong>{trialDays} jours gratuits</strong> pour
        lancer votre programme de fidélité.
      </Text>

      <Text style={highlightBox}>
        Configurez votre programme en <strong>3 minutes</strong> : choisissez votre récompense,
        affichez votre QR code, et vos clients commencent à cumuler des points.
      </Text>

      <Section style={stepsBox}>
        <Text style={stepItem}>
          <strong>1.</strong> Choisissez votre récompense (ex: &quot;1 soin offert après 10 passages&quot;)
        </Text>
        <Text style={stepItem}>
          <strong>2.</strong> Affichez votre QR code près de la caisse
        </Text>
        <Text style={stepItem}>
          <strong>3.</strong> Vos clients scannent à chaque visite — c&apos;est tout
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Créer mon programme
        </Button>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Répondez à cet email, on vous guide.
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
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const subheading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const highlightBox = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.6',
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
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

const stepsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
};

const benefitsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const benefitsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const benefitItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const testimonialBox = {
  borderLeft: '3px solid #4b0082',
  paddingLeft: '20px',
  margin: '0 0 24px 0',
};

const testimonialQuote = {
  color: '#4a5568',
  fontSize: '15px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const testimonialAuthor = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const urgencyText = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
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
  margin: '0 0 8px 0',
};

const challengeHint = {
  color: '#a16207',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default WelcomeEmail;
