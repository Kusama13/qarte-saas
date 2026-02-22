import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface InactiveMerchantDay7EmailProps {
  shopName: string;
}

export function InactiveMerchantDay7Email({ shopName }: InactiveMerchantDay7EmailProps) {
  return (
    <BaseLayout preview={`${shopName}, on peut vous aider à obtenir vos premiers scans`}>
      <Heading style={heading}>
        Vos premiers scans sont à portée de main
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre programme de fidélité est prêt. Pour obtenir vos premiers scans,
        il suffit souvent d&apos;un petit ajustement.
      </Text>

      <Section style={checklistBox}>
        <Text style={checklistTitle}>Checklist rapide :</Text>
        <Text style={checklistItem}>
          <strong>1.</strong> Affichez votre QR code à hauteur des yeux, près de la caisse
        </Text>
        <Text style={checklistItem}>
          <strong>2.</strong> Dites à vos prochains clients : &quot;Scannez ce QR code
          pour votre carte de fidélité, c&apos;est gratuit !&quot;
        </Text>
        <Text style={checklistItem}>
          <strong>3.</strong> Testez le scan vous-même pour voir ce que vos clients verront
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/qr-download">
          Télécharger mon QR code
        </Button>
      </Section>

      <Section style={tipBox}>
        <Text style={tipTitle}>Le secret</Text>
        <Text style={tipText}>
          Proposez le scan à vos <strong>3 prochains clients</strong> aujourd&apos;hui.
          Vous verrez les résultats apparaître en temps réel dans votre tableau de bord.
        </Text>
      </Section>

      <Text style={paragraph}>
        On est disponible si vous avez besoin d&apos;un coup de main.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20lancer%20mon%20programme%20Qarte">
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

const checklistBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const checklistTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const checklistItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.8',
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

export default InactiveMerchantDay7Email;
