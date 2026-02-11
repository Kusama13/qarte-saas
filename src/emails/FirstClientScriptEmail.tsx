import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface FirstClientScriptEmailProps {
  shopName: string;
  shopType: string;
  rewardDescription: string;
  stampsRequired: number;
}

const SCRIPTS: Record<string, string> = {
  coiffeur: "C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes",
  barbier: "C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes",
  onglerie: "Pendant que le vernis sèche, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
  institut_beaute: "Pendant qu'on pose le masque, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
  spa: "Avant de repartir, scannez le QR code pour votre carte de fidélité — ça prend 5 secondes",
  estheticienne: "Pendant la pause, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
  massage: "Avant de repartir, scannez le QR code pour votre carte de fidélité — ça prend 5 secondes",
  epilation: "Pendant qu'on prépare la cire, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes",
};

const DEFAULT_SCRIPT = "Avant de partir, scannez le QR code pour la carte de fidélité — 5 secondes et c'est fait";

export function FirstClientScriptEmail({ shopName, shopType, rewardDescription, stampsRequired }: FirstClientScriptEmailProps) {
  const normalized = shopType?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const script = SCRIPTS[normalized] || DEFAULT_SCRIPT;

  return (
    <BaseLayout preview={`${shopName}, la phrase exacte pour obtenir votre premier scan`}>
      <Heading style={heading}>
        La phrase exacte à dire à votre prochain(e) client(e)
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre QR code est prêt depuis 2 jours. Voici le secret des commerçant(e)s
        qui obtiennent des scans dès le premier jour : <strong>une phrase simple,
        au bon moment</strong>.
      </Text>

      <Section style={scriptBox}>
        <Text style={scriptLabel}>Dites simplement :</Text>
        <Text style={scriptText}>
          &quot;{script} — après <strong>{stampsRequired} passages</strong> c&apos;est{' '}
          <strong>{rewardDescription}</strong>.&quot;
        </Text>
      </Section>

      <Section style={tipBox}>
        <Text style={tipTitle}>🎯 Le meilleur moment pour le proposer</Text>
        <Text style={tipText}>
          Quand le/la client(e) <strong>attend</strong> : pendant le séchage,
          pendant la pose, au moment de payer. Ne demandez pas &quot;vous voulez une carte ?&quot;
          — dites directement <strong>&quot;Scannez le QR code pour votre carte de fidélité !&quot;</strong>
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={testBox}>
        <Text style={testTitle}>📱 Testez vous-même en 10 secondes</Text>
        <Text style={testText}>
          Scannez votre propre QR code avec votre téléphone. Vous verrez exactement
          ce que vos client(e)s verront. Ça prend 10 secondes.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/qr-download">
          Voir mon QR code
        </Button>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Répondez à cet email ou contactez-nous sur WhatsApp.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20pr%C3%A9senter%20le%20QR%20code%20%C3%A0%20mes%20clients">
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

const scriptBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #4b0082',
  textAlign: 'center' as const,
};

const scriptLabel = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
};

const scriptText = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '500',
  lineHeight: '1.5',
  margin: '0',
  fontStyle: 'italic' as const,
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

const testBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #bfdbfe',
};

const testTitle = {
  color: '#1e40af',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const testText = {
  color: '#1e3a5f',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
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

export default FirstClientScriptEmail;
