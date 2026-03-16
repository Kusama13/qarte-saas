import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface LastChanceSignupEmailProps {
  email: string;
}

export function LastChanceSignupEmail({ email }: LastChanceSignupEmailProps) {
  return (
    <BaseLayout preview="Votre compte Qarte sera supprimé bientôt — finalisez votre inscription">
      <Heading style={heading}>
        Votre compte n&apos;est pas encore finalisé
      </Heading>

      <Text style={paragraph}>
        Bonjour,
      </Text>

      <Text style={paragraph}>
        Vous avez créé un compte Qarte ({email}) il y a une semaine,
        mais votre commerce n&apos;est toujours pas enregistré.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          Votre espace sera <strong>supprimé automatiquement</strong> dans quelques jours
          si l&apos;inscription n&apos;est pas finalisée.
        </Text>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        L&apos;inscription prend <strong>3 minutes</strong> et l&apos;essai est 100% gratuit
        pendant 7 jours, sans carte bancaire.
      </Text>

      <Section style={promoBox}>
        <Text style={promoTitle}>Offre premier mois</Text>
        <Text style={promoText}>
          Si vous souscrivez après votre essai, votre <strong>premier mois est à 9€</strong> au
          lieu de 19€. Le code promo QARTE50 s&apos;applique automatiquement.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          Finaliser mon inscription
        </Button>
      </Section>

      <Text style={paragraph}>
        Une question avant de vous lancer ? Répondez à cet email.
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

const promoBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 8px 0',
  border: '2px solid #f59e0b',
  textAlign: 'center' as const,
};

const promoTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const promoText = {
  color: '#78350f',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
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

export default LastChanceSignupEmail;
