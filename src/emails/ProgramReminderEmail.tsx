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
    <BaseLayout preview={`${shopName}, votre programme de fidélité n'attend plus que vous`}>
      <Heading style={heading}>
        Votre programme n&apos;est pas encore configuré
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Vous avez créé votre compte Qarte hier, mais votre programme de
        fidélité n&apos;est pas encore en place. Vos clients passent chez vous
        aujourd&apos;hui — et chaque passage sans fidélisation, c&apos;est une
        occasion manquée.
      </Text>

      <Text style={highlightBox}>
        En <strong>3 minutes</strong>, vous pouvez avoir un programme
        opérationnel. Il suffit de choisir votre récompense et d&apos;afficher
        votre QR code.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Configurer mon programme maintenant
        </Button>
      </Section>

      <Hr style={divider} />

      <Heading as="h2" style={subheading}>
        Vous ne savez pas quoi offrir ? Voici des idées :
      </Heading>

      <Section style={ideasBox}>
        <Text style={ideaItem}>
          💅 <strong>Onglerie :</strong> &quot;1 pose offerte après 10 passages&quot;
        </Text>
        <Text style={ideaItem}>
          💇 <strong>Coiffeur :</strong> &quot;1 brushing offert après 8 visites&quot;
        </Text>
        <Text style={ideaItem}>
          💆 <strong>Institut :</strong> &quot;1 soin visage offert après 10 passages&quot;
        </Text>
        <Text style={ideaItem}>
          🍕 <strong>Restaurant :</strong> &quot;1 dessert offert après 5 repas&quot;
        </Text>
      </Section>

      <Text style={paragraph}>
        Pas besoin d&apos;être parfait du premier coup — vous pourrez modifier
        votre récompense à tout moment.
      </Text>

      <Hr style={divider} />

      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>
          &quot;J&apos;ai hésité 2 jours, puis j&apos;ai configuré mon
          programme en 5 minutes. Dès le lendemain, mes clientes scannaient
          le QR code.&quot;
        </Text>
        <Text style={testimonialAuthor}>
          — Élodie, Nail Salon by Elodie
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonSecondary} href="https://getqarte.com/dashboard/program">
          Lancer mon programme
        </Button>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Répondez à cet email ou contactez-nous directement
        sur WhatsApp, on vous guide en 5 minutes.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20configurer%20mon%20programme%20Qarte">
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
  backgroundColor: '#654EDA',
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
  borderLeft: '3px solid #654EDA',
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
  color: '#654EDA',
  fontSize: '14px',
  fontWeight: '600',
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

export default ProgramReminderEmail;
