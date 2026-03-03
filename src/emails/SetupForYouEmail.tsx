import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface SetupForYouEmailProps {
  email: string;
}

export function SetupForYouEmail({ email }: SetupForYouEmailProps) {
  return (
    <BaseLayout preview="Répondez OUI et on configure tout pour vous — gratuitement">
      <Heading style={heading}>
        On peut le faire pour vous
      </Heading>

      <Text style={paragraph}>
        Bonjour,
      </Text>

      <Text style={paragraph}>
        Vous avez cr&eacute;&eacute; votre compte Qarte il y a 3 jours ({email}),
        mais la configuration n&apos;est pas termin&eacute;e.
      </Text>

      <Text style={paragraph}>
        On comprend &mdash; entre les clients, les rendez-vous et le quotidien,
        c&apos;est pas toujours facile de trouver 3 minutes.
      </Text>

      <Section style={offerBox}>
        <Text style={offerTitle}>On s&apos;en occupe pour vous</Text>
        <Text style={offerText}>
          R&eacute;pondez &agrave; cet email avec :
        </Text>
        <Text style={offerList}>
          &bull; Le nom de votre commerce<br />
          &bull; Votre activit&eacute; (coiffeur, onglerie, spa...)<br />
          &bull; Votre adresse
        </Text>
        <Text style={offerText}>
          Et on configure <strong>tout</strong> pour vous en moins de 10 minutes.
          Gratuit, inclus dans votre essai.
        </Text>
      </Section>

      <Text style={paragraph}>
        Ou si vous pr&eacute;f&eacute;rez le faire vous-m&ecirc;me, c&apos;est
        toujours possible :
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          Finaliser mon inscription
        </Button>
      </Section>

      <Text style={signature}>
        &Agrave; tr&egrave;s vite,
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

const offerBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
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
  margin: '0 0 12px 0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default SetupForYouEmail;
