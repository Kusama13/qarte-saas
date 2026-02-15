import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ChallengeCompletedEmailProps {
  shopName: string;
  promoCode: string;
}

export function ChallengeCompletedEmail({ shopName, promoCode }: ChallengeCompletedEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, défi réussi — votre code promo est prêt`}>
      <Heading style={heading}>
        Défi réussi !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Bravo ! Vous avez fait scanner <strong>5 clients en 3 jours</strong>.
        Votre programme de fidélité est lancé et vos clients reviennent déjà.
      </Text>

      <Section style={promoBox}>
        <Text style={promoLabel}>Votre code promo</Text>
        <Text style={promoCodeStyle}>{promoCode}</Text>
        <Text style={promoValue}>
          Premier mois à <strong>9€</strong> au lieu de 19€
        </Text>
        <Text style={promoExpiry}>
          Ce code est valable <strong>24 heures seulement</strong>
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          Activer mon abonnement à 9€
        </Button>
      </Section>

      <Hr style={divider} />

      <Section style={recapBox}>
        <Text style={recapTitle}>Ce que vous avez déjà accompli :</Text>
        <Text style={recapItem}>Votre programme de fidélité est en ligne</Text>
        <Text style={recapItem}>5 clients fidélisés en 3 jours</Text>
        <Text style={recapItem}>Vos clients reviendront d&apos;eux-mêmes</Text>
      </Section>

      <Text style={paragraph}>
        Ne laissez pas retomber cette dynamique — activez votre abonnement
        maintenant et continuez à fidéliser vos clients sans interruption.
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Le code <strong>{promoCode}</strong> expire dans 24h.
          Après ça, l&apos;abonnement sera au tarif normal de 19€/mois.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20r%C3%A9ussi%20le%20d%C3%A9fi%20et%20je%20souhaite%20activer%20mon%20abonnement">
          Une question ? Écrivez-nous
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

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #4b0082',
  textAlign: 'center' as const,
};

const promoLabel = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  margin: '0 0 8px 0',
};

const promoCodeStyle = {
  color: '#4b0082',
  fontSize: '32px',
  fontWeight: '800',
  letterSpacing: '0.15em',
  margin: '0 0 12px 0',
};

const promoValue = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const promoExpiry = {
  color: '#e53e3e',
  fontSize: '14px',
  fontWeight: '600',
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

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const recapBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const recapTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const recapItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
  paddingLeft: '16px',
};

const urgencyBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
  border: '1px solid #fde68a',
};

const urgencyText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
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

export default ChallengeCompletedEmail;
