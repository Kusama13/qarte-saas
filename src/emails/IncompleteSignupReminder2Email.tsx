import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface IncompleteSignupReminder2EmailProps {
  email: string;
}

export function IncompleteSignupReminder2Email({ email }: IncompleteSignupReminder2EmailProps) {
  return (
    <BaseLayout preview="Votre espace Qarte vous attend toujours">
      <Heading style={heading}>
        On ne vous a pas oubli&eacute; !
      </Heading>

      <Text style={paragraph}>
        Bonjour,
      </Text>

      <Text style={paragraph}>
        Vous avez commenc&eacute; &agrave; cr&eacute;er votre compte Qarte il y a quelques heures,
        mais la configuration de votre commerce n&apos;est pas termin&eacute;e.
      </Text>

      <Text style={highlightBox}>
        Votre espace est <strong>d&eacute;j&agrave; pr&ecirc;t</strong>. Il ne manque que
        les infos de votre commerce pour lancer votre programme de fid&eacute;lit&eacute;.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          Reprendre mon inscription
        </Button>
      </Section>

      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>
          &laquo; J&apos;ai configur&eacute; mon programme en 3 minutes, et d&egrave;s la premi&egrave;re
          semaine j&apos;avais des clients qui revenaient avec leur carte. &raquo;
        </Text>
        <Text style={testimonialAuthor}>
          &mdash; Un coiffeur sur Qarte
        </Text>
      </Section>

      <Text style={paragraph}>
        Si vous avez des questions ou besoin d&apos;aide, je suis l&agrave; :
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20finaliser%20mon%20inscription%20Qarte">
          &Eacute;crire sur WhatsApp
        </Button>
      </Section>

      <Text style={signature}>
        À très vite,
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

const highlightBox = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.6',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
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

const testimonialBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
  borderLeft: '4px solid #4b0082',
};

const testimonialQuote = {
  color: '#4a5568',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const testimonialAuthor = {
  color: '#718096',
  fontSize: '13px',
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

export default IncompleteSignupReminder2Email;
