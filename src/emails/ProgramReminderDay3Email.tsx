import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ProgramReminderDay3EmailProps {
  shopName: string;
  daysRemaining: number;
}

export function ProgramReminderDay3Email({ shopName, daysRemaining }: ProgramReminderDay3EmailProps) {
  return (
    <BaseLayout preview={`${shopName}, il vous reste ${daysRemaining} jours d'essai — configurez votre programme`}>
      <Heading style={heading}>
        Dernier rappel : votre programme attend toujours
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Cela fait 3 jours que votre compte est créé. Si vous recevez 10 clients
        par jour, ce sont déjà <strong>30 clients qui auraient pu être fidélisés</strong>.
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Votre essai de 15 jours avance — il vous reste <strong>{daysRemaining} jours</strong>.
        </Text>
      </Section>

      <Hr style={divider} />

      <Heading as="h2" style={subheading}>
        Deux options pour démarrer :
      </Heading>

      <Section style={optionBox}>
        <Text style={optionLabel}>Option A — Faites-le vous-même (3 min)</Text>
        <Text style={optionDescription}>
          Cliquez ci-dessous, tapez votre récompense, et votre programme est en ligne.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href="https://getqarte.com/dashboard/program">
            Configurer maintenant
          </Button>
        </Section>
      </Section>

      <Section style={optionBox}>
        <Text style={optionLabel}>Option B — On le fait pour vous</Text>
        <Text style={optionDescription}>
          Répondez à cet email avec le nom de votre récompense
          (ex: &quot;1 brushing offert après 8 visites&quot;) et on configure tout pour vous.
        </Text>
        <Section style={buttonContainer}>
          <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20pouvez-vous%20configurer%20mon%20programme%20Qarte%20pour%20moi%20%3F">
            Nous écrire sur WhatsApp
          </Button>
        </Section>
      </Section>

      <Hr style={divider} />

      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>
          &quot;J&apos;avais pas le temps de m&apos;en occuper, je leur ai envoyé
          un message et 10 minutes après mon programme était en ligne.&quot;
        </Text>
        <Text style={testimonialAuthor}>
          — Sarah, Institut Beauté Zen
        </Text>
      </Section>

      <Text style={paragraph}>
        Pas de pression — mais chaque jour qui passe, ce sont des clients
        qui repartent sans raison de revenir.
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

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const optionBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 16px 0',
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
  margin: '16px 0 0 0',
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

export default ProgramReminderDay3Email;
