import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface Day5CheckinEmailProps {
  shopName: string;
  totalScans: number;
  referralCode?: string;
}

export function Day5CheckinEmail({ shopName, totalScans }: Day5CheckinEmailProps) {
  const hasScans = totalScans > 0;

  return (
    <BaseLayout preview={`${shopName}, comment se passe ta 1ère semaine ?`}>
      <Heading style={heading}>
        Comment se passe ta première semaine ?
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      {hasScans ? (
        <>
          <Text style={paragraph}>
            Tu as déjà <strong>{totalScans} scan{totalScans > 1 ? 's' : ''}</strong> cette
            semaine, bravo ! Continue comme ça.
          </Text>

          <Section style={successBox}>
            <Text style={successTitle}>Prochaine étape</Text>
            <Text style={successText}>
              Partage ton programme sur tes réseaux sociaux pour toucher
              encore plus de clients. Ton kit est prêt dans ton espace.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard/qr-download?tab=social">
              Télécharger mon kit réseaux sociaux
            </Button>
          </Section>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            Ton programme est configuré et ton QR code est prêt.
            Il ne manque plus que tes clients !
          </Text>

          <Section style={actionBox}>
            <Text style={actionTitle}>3 actions pour démarrer aujourd&apos;hui :</Text>
            <Text style={actionItem}>
              <strong>1.</strong> Imprime ton QR code et place-le près de la caisse
            </Text>
            <Text style={actionItem}>
              <strong>2.</strong> Propose le scan à tes 5 prochains clients
            </Text>
            <Text style={actionItem}>
              <strong>3.</strong> Partage sur Instagram / Facebook
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard/qr-download">
              Accéder à mon QR code
            </Button>
          </Section>
        </>
      )}

      <Text style={paragraph}>
        Besoin d&apos;aide ou de conseils ? Réponds à cet email.
      </Text>

      <Text style={signature}>
        À très vite,
        <br />
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

const successBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #22c55e',
};

const successTitle = {
  color: '#166534',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const successText = {
  color: '#15803d',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const actionBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const actionTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const actionItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 4px 0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default Day5CheckinEmail;
