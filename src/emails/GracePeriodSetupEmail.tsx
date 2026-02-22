import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface GracePeriodSetupEmailProps {
  shopName: string;
  daysUntilDeletion: number;
}

export function GracePeriodSetupEmail({ shopName, daysUntilDeletion }: GracePeriodSetupEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, votre essai est terminé — on peut encore vous aider`}>
      <Heading style={heading}>
        Votre essai est terminé — il n&apos;est pas trop tard
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre essai est terminé, mais votre programme de fidélité
        n&apos;a jamais été configuré. On comprend que le quotidien passe vite.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          Vos données sont conservées encore <strong>{daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''}</strong>.
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={offerBox}>
        <Text style={offerTitle}>On le fait ensemble en 2 minutes</Text>
        <Text style={offerText}>
          Envoyez-nous un message WhatsApp et on configure
          votre programme <strong>pendant que vous êtes avec vos clients</strong>.
          Tout ce qu&apos;on a besoin :
        </Text>
        <Text style={offerList}>
          &bull; Quelle récompense offrir (ex: &quot;1 soin offert après 10 visites&quot;)<br />
          &bull; C&apos;est tout. On s&apos;occupe du reste.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20mon%20essai%20Qarte%20est%20termin%C3%A9%20mais%20j%27aimerais%20configurer%20mon%20programme.%20Pouvez-vous%20m%27aider%20%3F">
          Configurer avec nous sur WhatsApp
        </Button>
      </Section>

      <Text style={paragraph}>
        Ou faites-le vous-même en 3 minutes :
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Configurer mon programme
        </Button>
      </Section>

      <Section style={reassuranceBox}>
        <Text style={reassuranceText}>
          Après configuration, vous pourrez réactiver votre abonnement à
          <strong> 9€/mois le premier mois</strong> (au lieu de 19€).
        </Text>
      </Section>

      <Text style={signature}>
        On est là pour vous,
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

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const infoText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const offerBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 8px 0',
  border: '2px solid #10b981',
};

const offerTitle = {
  color: '#065f46',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const offerText = {
  color: '#065f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const offerList = {
  color: '#065f46',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
  paddingLeft: '8px',
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
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const reassuranceBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
};

const reassuranceText = {
  color: '#4b0082',
  fontSize: '14px',
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

export default GracePeriodSetupEmail;
