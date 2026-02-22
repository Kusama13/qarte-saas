import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface InactiveMerchantDay30EmailProps {
  shopName: string;
}

export function InactiveMerchantDay30Email({ shopName }: InactiveMerchantDay30EmailProps) {
  return (
    <BaseLayout preview={`${shopName}, on aimerait comprendre ce qui vous bloque`}>
      <Heading style={heading}>
        On prend de vos nouvelles
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        C&apos;est l&apos;équipe Qarte. Votre programme de fidélité
        n&apos;a pas eu de scans ce mois-ci.
      </Text>

      <Text style={paragraph}>
        On aimerait comprendre ce qui vous bloque. Si vous avez 2 minutes,
        envoyez-nous un message — on peut configurer ou ajuster votre
        programme ensemble.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%20Qarte%2C%20j%27aimerais%20discuter%20de%20mon%20compte">
          Nous écrire sur WhatsApp
        </Button>
      </Section>

      <Text style={paragraph}>
        Pas de pression. On veut juste que chaque commerçant qui nous fait
        confiance obtienne des résultats.
      </Text>

      <Text style={signatureBlock}>
        L&apos;équipe Qarte
        <br />
        <span style={signaturePhone}>WhatsApp : 06 07 44 74 20</span>
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '22px',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
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

const signatureBlock = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '32px 0 0 0',
  fontWeight: '500',
};

const signaturePhone = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '400' as const,
};

export default InactiveMerchantDay30Email;
