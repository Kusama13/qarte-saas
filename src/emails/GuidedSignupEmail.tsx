import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface GuidedSignupEmailProps {
  email: string;
}

export function GuidedSignupEmail({ email }: GuidedSignupEmailProps) {
  return (
    <BaseLayout preview="On vous guide pas à pas — 30 secondes pour lancer votre programme">
      <Heading style={heading}>
        30 secondes, on vous guide
      </Heading>

      <Text style={paragraph}>
        Bonjour,
      </Text>

      <Text style={paragraph}>
        Vous avez cr&eacute;&eacute; votre compte Qarte hier ({email}), mais votre commerce
        n&apos;est pas encore enregistr&eacute;.
      </Text>

      <Section style={highlightBox}>
        <Text style={highlightText}>
          On a simplifi&eacute; le formulaire au maximum :
          <br /><strong>4 champs</strong> (nom, activit&eacute;, t&eacute;l&eacute;phone, adresse)
          <br />&rarr; Votre QR code est g&eacute;n&eacute;r&eacute; automatiquement apr&egrave;s.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          Finaliser en 30 secondes
        </Button>
      </Section>

      <Section style={stepsBox}>
        <Text style={stepsTitle}>Ce qui se passe ensuite :</Text>
        <Text style={stepItem}>1️⃣ Vous remplissez 4 champs</Text>
        <Text style={stepItem}>2️⃣ Vous choisissez une r&eacute;compense (on vous sugg&egrave;re la meilleure)</Text>
        <Text style={stepItem}>3️⃣ Votre QR code est pr&ecirc;t &mdash; vos clients peuvent scanner</Text>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;un coup de main ? R&eacute;pondez &agrave; cet email,
        on r&eacute;pond en moins d&apos;1h.
      </Text>

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

const highlightBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px 0',
};

const highlightText = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '0',
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

const stepsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const stepsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '2',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default GuidedSignupEmail;
