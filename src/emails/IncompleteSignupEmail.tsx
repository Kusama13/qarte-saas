import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface IncompleteSignupEmailProps {
  email: string;
}

export function IncompleteSignupEmail({ email }: IncompleteSignupEmailProps) {
  return (
    <BaseLayout preview="Votre compte Qarte est presque prêt — il ne reste que 30 secondes">
      <Heading style={heading}>
        Vous y êtes presque !
      </Heading>

      <Text style={paragraph}>
        Bonjour ({email}),
      </Text>

      <Text style={paragraph}>
        Vous avez créé votre compte Qarte, mais vous n&apos;avez pas terminé la
        configuration de votre commerce.
      </Text>

      <Text style={highlightBox}>
        Il ne reste que <strong>4 champs à remplir</strong> (nom, activité,
        téléphone, adresse) — ça prend <strong>30 secondes</strong>.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          Finaliser mon inscription
        </Button>
      </Section>

      <Section style={benefitsBox}>
        <Text style={benefitsTitle}>Ce qui vous attend après :</Text>
        <Text style={benefitItem}>→ Un programme de fidélité prêt en 3 minutes</Text>
        <Text style={benefitItem}>→ Un QR code unique pour votre commerce</Text>
        <Text style={benefitItem}>→ 7 jours d&apos;essai gratuit</Text>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Répondez à cet email ou contactez-nous sur
        WhatsApp.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20finaliser%20mon%20inscription%20Qarte">
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

const benefitsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
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

export default IncompleteSignupEmail;
