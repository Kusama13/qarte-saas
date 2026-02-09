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
    <BaseLayout preview={`${shopName}, un mois sans utiliser Qarte — on peut vous aider ?`}>
      <Heading style={heading}>
        Un mois sans utiliser Qarte
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        C&apos;est Judicael de l&apos;équipe Qarte. Je vois que votre programme
        de fidélité n&apos;a pas encore eu de passages ce mois-ci. Je voulais
        simplement prendre des nouvelles.
      </Text>

      <Section style={optionsBox}>
        <Text style={optionsTitle}>
          Dites-nous comment on peut vous aider :
        </Text>

        <Text style={optionItem}>
          <strong>A)</strong> Vous n&apos;avez pas eu le temps ?
          <br />
          Répondez &quot;A&quot; et on planifie un appel de 5 min pour tout mettre
          en place ensemble.
        </Text>

        <Text style={optionItem}>
          <strong>B)</strong> Quelque chose ne fonctionne pas ?
          <br />
          Répondez &quot;B&quot; et on regarde votre compte ensemble.
        </Text>

        <Text style={optionItem}>
          <strong>C)</strong> Qarte ne correspond pas à vos besoins ?
          <br />
          Répondez &quot;C&quot; et dites-nous pourquoi, ça nous aide énormément.
        </Text>
      </Section>

      <Text style={paragraph}>
        Pas de pression. On veut juste que chaque commerçant qui nous fait
        confiance obtienne des résultats.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%20Judicael%2C%20j%27aimerais%20discuter%20de%20mon%20compte%20Qarte">
          R&eacute;pondre sur WhatsApp
        </Button>
      </Section>

      <Text style={signatureBlock}>
        Judicael
        <br />
        Fondateur, Qarte
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

const optionsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const optionsTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 20px 0',
};

const optionItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
  paddingBottom: '16px',
  borderBottom: '1px solid #e8e8e8',
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
