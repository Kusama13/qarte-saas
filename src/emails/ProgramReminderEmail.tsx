import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ProgramReminderEmailProps {
  shopName: string;
}

export function ProgramReminderEmail({ shopName }: ProgramReminderEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, ton programme de fid&eacute;lit&eacute; n'attend plus que toi`}>
      <Heading style={heading}>
        Plus qu&apos;une &eacute;tape pour fid&eacute;liser tes clients
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ton compte Qarte est pr&ecirc;t. Il ne manque plus que ta r&eacute;compense
        pour lancer ton programme de fid&eacute;lit&eacute;.
      </Text>

      <Text style={highlightBox}>
        Choisis ce que tu offres &agrave; tes clients fid&egrave;les, et ton QR code
        sera g&eacute;n&eacute;r&eacute; automatiquement. &Ccedil;a prend <strong>3 minutes</strong>.
        Tu pourras modifier ta r&eacute;compense &agrave; tout moment.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Configurer mon programme
        </Button>
      </Section>

      <Text style={paragraph}>
        Tu ne sais pas quoi offrir ? On te sugg&egrave;re la meilleure r&eacute;compense
        pour ton activit&eacute; directement dans la page de configuration.
      </Text>

      <Text style={paragraph}>
        Besoin d&apos;aide ? R&eacute;ponds &agrave; cet email, on peut le faire pour toi en 5 minutes.
      </Text>

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

const subheading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const highlightBox = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.6',
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px 0',
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

const buttonSecondary = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const ideasBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const ideaItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
};

const testimonialBox = {
  borderLeft: '3px solid #4b0082',
  paddingLeft: '20px',
  margin: '0 0 24px 0',
};

const testimonialQuote = {
  color: '#4a5568',
  fontSize: '15px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const testimonialAuthor = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ProgramReminderEmail;
