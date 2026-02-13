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
    <BaseLayout preview={`${shopName}, aucun passage cette semaine — on peut vous aider`}>
      <Heading style={heading}>
        Aucun passage depuis 7 jours, tout va bien ?
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre programme de fidélité est prêt, mais nous n&apos;avons enregistré
        aucun passage cette semaine. Pas de panique — c&apos;est souvent un
        problème d&apos;affichage.
      </Text>

      <Section style={checklistBox}>
        <Text style={checklistTitle}>Vérifiez ces 3 points :</Text>
        <Text style={checklistItem}>
          <strong>1.</strong> Votre QR code est-il imprimé et affiché près de la caisse ?
        </Text>
        <Text style={checklistItem}>
          <strong>2.</strong> Vos clients savent-ils qu&apos;ils peuvent scanner ?
          Mentionnez-le simplement : &quot;Scannez pour votre carte de fidélité !&quot;
        </Text>
        <Text style={checklistItem}>
          <strong>3.</strong> Avez-vous testé le scan vous-même avec votre téléphone ?
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/qr-download">
          Télécharger mon QR code
        </Button>
      </Section>

      <Section style={tipBox}>
        <Text style={tipTitle}>Astuce rapide</Text>
        <Text style={tipText}>
          Demandez à vos <strong>3 prochains clients</strong> de scanner.
          Vous verrez le résultat dans votre tableau de bord en temps réel.
          Les commerçants qui affichent leur QR code à hauteur des yeux, près
          de la caisse, obtiennent 3x plus de scans.
        </Text>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide pour l&apos;affichage ? On vous envoie des conseils
        personnalisés — répondez à cet email.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20afficher%20mon%20QR%20code%20Qarte">
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
