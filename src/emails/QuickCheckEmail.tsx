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
    <BaseLayout preview={`${shopName}, une question rapide sur votre programme`}>
      <Heading style={heading}>
        Une question rapide
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Cela fait 4 jours que votre programme de fidélité est en place, mais nous
        n&apos;avons toujours pas de scan. Est-ce que quelque chose vous bloque ?
      </Text>

      <Section style={optionBox}>
        <Text style={optionLabel}>Je n&apos;ai pas encore imprimé le QR code</Text>
        <Section style={buttonContainer}>
          <Button style={button} href="https://getqarte.com/dashboard/qr-download">
            Télécharger mon QR code
          </Button>
        </Section>
      </Section>

      <Section style={optionBox}>
        <Text style={optionLabel}>Je ne sais pas comment le présenter</Text>
        <Section style={buttonContainer}>
          <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20pr%C3%A9senter%20le%20QR%20code%20%C3%A0%20mes%20client(e)s">
            On vous aide sur WhatsApp
          </Button>
        </Section>
      </Section>

      <Section style={optionBox}>
        <Text style={optionLabel}>J&apos;ai un autre problème</Text>
        <Text style={optionDescription}>
          Répondez simplement à cet email, on vous répond dans la journée.
        </Text>
      </Section>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Il vous reste <strong>{daysRemaining} jours</strong> d&apos;essai.
          On veut vraiment que vous voyiez des résultats avant la fin.
        </Text>
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

const optionBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 12px 0',
};

const optionLabel = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const optionDescription = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '12px 0 0 0',
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
