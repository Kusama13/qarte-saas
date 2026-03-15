import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface QuickCheckEmailProps {
  shopName: string;
  daysRemaining: number;
}

export function QuickCheckEmail({ shopName, daysRemaining }: QuickCheckEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, ton QR code est prêt — il ne manque que le premier scan`}>
      <Heading style={heading}>
        Ton QR code est prêt ?
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ton programme est configuré depuis 4 jours, mais on n&apos;a pas encore
        de scan. Le plus souvent, c&apos;est parce que le QR code n&apos;est
        pas encore imprimé ou pas assez visible.
      </Text>

      <Section style={tipBox}>
        <Text style={tipTitle}>Le bon réflexe</Text>
        <Text style={tipText}>
          Imprime ton QR code et place-le à hauteur des yeux, près de la caisse.
          Puis dis à tes prochains clients : &quot;Scannez ce QR code pour votre
          carte de fidélité, c&apos;est gratuit !&quot;
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/qr-download">
          Télécharger mon QR code
        </Button>
      </Section>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Il te reste <strong>{daysRemaining} jours</strong> d&apos;essai gratuit.
        </Text>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Réponds à cet email.
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

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default QuickCheckEmail;
