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
    <BaseLayout preview={`${shopName}, on garde vos données encore ${daysUntilDeletion} jours — configurez votre programme`}>
      <Heading style={heading}>
        On garde vos donn&eacute;es {daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''} de plus
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre essai est termin&eacute;, mais votre programme de fid&eacute;lit&eacute;
        n&apos;a jamais &eacute;t&eacute; configur&eacute;. On comprend que le quotidien passe vite.
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Vos donn&eacute;es seront <strong>supprim&eacute;es dans {daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''}</strong>.
          <br />Mais il n&apos;est pas trop tard.
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={offerBox}>
        <Text style={offerTitle}>On le fait ensemble en 2 minutes</Text>
        <Text style={offerText}>
          Envoyez-nous un message WhatsApp maintenant, et on configure
          votre programme <strong>pendant que vous &ecirc;tes avec vos clients</strong>.
          Tout ce qu&apos;on a besoin :
        </Text>
        <Text style={offerList}>
          &bull; Quelle r&eacute;compense offrir (ex: &quot;1 soin offert apr&egrave;s 10 visites&quot;)<br />
          &bull; C&apos;est tout. On s&apos;occupe du reste.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20mon%20essai%20Qarte%20est%20termin%C3%A9%20mais%20j%27aimerais%20configurer%20mon%20programme.%20Pouvez-vous%20m%27aider%20%3F">
          Configurer avec nous sur WhatsApp
        </Button>
      </Section>

      <Text style={paragraph}>
        Ou faites-le vous-m&ecirc;me en 3 minutes :
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Configurer mon programme
        </Button>
      </Section>

      <Section style={reassuranceBox}>
        <Text style={reassuranceText}>
          Apr&egrave;s configuration, vous pourrez r&eacute;activer votre abonnement &agrave;
          <strong> 9&euro;/mois le premier mois</strong> (au lieu de 19&euro;).
          Vos donn&eacute;es seront pr&eacute;serv&eacute;es.
        </Text>
      </Section>

      <Text style={signature}>
        On est l&agrave; pour vous,
        <br />
        L&apos;&eacute;quipe Qarte
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

const urgencyBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fecaca',
};

const urgencyText = {
  color: '#991b1b',
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
