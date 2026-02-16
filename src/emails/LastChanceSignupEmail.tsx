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
    <BaseLayout preview="Dernière chance — votre place est réservée, mais pas pour longtemps">
      <Heading style={heading}>
        Derni&egrave;re chance : votre place est r&eacute;serv&eacute;e
      </Heading>

      <Text style={paragraph}>
        Bonjour,
      </Text>

      <Text style={paragraph}>
        Cela fait une semaine que vous avez cr&eacute;&eacute; votre compte Qarte ({email}),
        mais votre commerce n&apos;est toujours pas enregistr&eacute;.
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Votre espace sera <strong>supprim&eacute; automatiquement</strong> dans quelques jours
          si la configuration n&apos;est pas finalis&eacute;e.
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={promoBox}>
        <Text style={promoTitle}>Offre de derni&egrave;re minute</Text>
        <Text style={promoText}>
          Finalisez votre inscription dans les <strong>24 prochaines heures</strong> et
          obtenez votre <strong>premier mois &agrave; 9&euro;</strong> au lieu de 19&euro;
          si vous souscrivez.
        </Text>
        <Text style={promoNote}>
          Code automatique &mdash; rien &agrave; saisir.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/auth/merchant/signup/complete">
          Finaliser maintenant (offre 9&euro;)
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        Si Qarte ne vous convient pas, aucun souci &mdash; on supprimera votre
        compte automatiquement. Mais si vous h&eacute;sitez encore :
      </Text>

      <Section style={benefitsBox}>
        <Text style={benefitItem}>&bull; 7 jours d&apos;essai <strong>gratuit</strong>, sans carte bancaire</Text>
        <Text style={benefitItem}>&bull; Configuration en <strong>3 minutes</strong></Text>
        <Text style={benefitItem}>&bull; <strong>0 app &agrave; t&eacute;l&eacute;charger</strong> pour vos clients</Text>
        <Text style={benefitItem}>&bull; Annulation <strong>en 1 clic</strong>, sans engagement</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27h%C3%A9site%20encore%20pour%20Qarte%2C%20pouvez-vous%20m%27aider%20%3F">
          Une question ? WhatsApp
        </Button>
      </Section>

      <Text style={signature}>
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
  margin: '0 0 8px 0',
};

const promoNote = {
  color: '#92400e',
  fontSize: '13px',
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

const benefitsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const benefitItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '2',
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

export default LastChanceSignupEmail;
