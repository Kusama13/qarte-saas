import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface WelcomeEmailProps {
  shopName: string;
  trialDays?: number;
}

export function WelcomeEmail({ shopName, trialDays = 7 }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, votre programme de fidélité est prêt en 3 minutes`}>
      <Heading style={heading}>
        {shopName}, vos clients n&apos;attendent que vous
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre compte Qarte est créé. Vous avez <strong>{trialDays} jours gratuits</strong> pour
        lancer votre programme de fidélité — et ça prend <strong>3 minutes</strong>.
      </Text>

      <Text style={highlightBox}>
        Chaque jour sans programme, c&apos;est des clients qui passent chez vous
        sans être fidélisés. Ne laissez pas passer cette opportunité.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Créer mon programme en 3 minutes
        </Button>
      </Section>

      <Hr style={divider} />

      <Heading as="h2" style={subheading}>
        3 étapes et c&apos;est parti :
      </Heading>

      <Section style={stepsBox}>
        <Text style={stepItem}>
          <strong>1.</strong> Choisissez votre récompense (ex: &quot;1 soin offert après 10 passages&quot;)
        </Text>
        <Text style={stepItem}>
          <strong>2.</strong> Imprimez votre QR code et affichez-le en caisse
        </Text>
        <Text style={stepItem}>
          <strong>3.</strong> Vos clients scannent à chaque visite — c&apos;est tout
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={benefitsBox}>
        <Text style={benefitsTitle}>Pourquoi les commerçants adorent Qarte :</Text>
        <Text style={benefitItem}>+40% de clients réguliers en moyenne</Text>
        <Text style={benefitItem}>Aucune app à télécharger pour vos clients</Text>
        <Text style={benefitItem}>Tableau de bord pour suivre vos visites</Text>
        <Text style={benefitItem}>Fonctionne dès le premier scan</Text>
      </Section>

      <Hr style={divider} />

      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>
          &quot;J&apos;ai configuré mon programme en 5 minutes. Dès le lendemain, mes
          clientes scannaient le QR code. Maintenant elles reviennent toutes les
          3 semaines.&quot;
        </Text>
        <Text style={testimonialAuthor}>
          — Élodie, Nail Salon by Elodie
        </Text>
      </Section>

      <Text style={urgencyText}>
        Vos {trialDays} jours d&apos;essai ont commencé — profitez-en maintenant.
      </Text>

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

const stepsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
};

const benefitsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const benefitsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const benefitItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
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

const urgencyText = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
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

export default WelcomeEmail;
