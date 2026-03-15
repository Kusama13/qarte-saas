import {
  Heading,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface InactiveMerchantDay30EmailProps {
  shopName: string;
}

export function InactiveMerchantDay30Email({ shopName }: InactiveMerchantDay30EmailProps) {
  return (
    <BaseLayout preview={`${shopName}, on aimerait comprendre ce qui te bloque`}>
      <Heading style={heading}>
        On prend de tes nouvelles
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        C&apos;est l&apos;équipe Qarte. Ton programme de fidélité
        n&apos;a pas eu de scans ce mois-ci.
      </Text>

      <Text style={paragraph}>
        On aimerait comprendre ce qui te bloque. Si tu as 2 minutes,
        réponds à cet email — on peut configurer ou ajuster ton
        programme ensemble.
      </Text>

      <Text style={paragraph}>
        Pas de pression. On veut juste que chaque commerçant qui nous fait
        confiance obtienne des résultats.
      </Text>

      <Text style={signatureBlock}>
        L&apos;équipe Qarte
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

const signatureBlock = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '32px 0 0 0',
  fontWeight: '500',
};

export default InactiveMerchantDay30Email;
