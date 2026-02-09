import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface TrialExpiredEmailProps {
  shopName: string;
  daysUntilDeletion: number;
  promoCode?: string;
}

export function TrialExpiredEmail({ shopName, daysUntilDeletion, promoCode }: TrialExpiredEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, votre essai est terminé`}>
      <Heading style={heading}>
        Votre essai est terminé
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre période d&apos;essai Qarte est arrivée à son terme.
        Pas de panique : <strong>vos données sont en sécurité</strong> et on garde tout pour vous.
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>Ce qui se passe maintenant</Text>
        <Text style={infoText}>
          Votre compte est en pause. Vos clients ne peuvent plus valider leurs passages
          et votre QR code est temporairement désactivé.
        </Text>
        <Text style={infoText}>
          Vos données restent intactes pendant encore <strong>{daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''}</strong>.
          Réactivez quand vous voulez, tout sera là.
        </Text>
      </Section>

      {promoCode ? (
        <Section style={promoBox}>
          <Text style={promoTitle}>Offre spéciale pour vous</Text>
          <Text style={promoPrice}>
            <span style={promoPriceOld}>19€</span> → 9€/mois le 1er mois
          </Text>
          <Text style={promoLabel}>CODE PROMO</Text>
          <Text style={promoCodeStyle}>{promoCode}</Text>
          <Text style={promoNote}>Utilisez ce code lors du paiement</Text>
        </Section>
      ) : (
        <Section style={offerBox}>
          <Text style={offerTitle}>On veut vous aider à réussir</Text>
          <Text style={offerText}>
            Réactivez maintenant et on vous accompagne personnellement
            pour lancer votre programme avec vos premiers clients.
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {promoCode ? 'Réactiver à 9€ le 1er mois' : 'Réactiver mon compte — 19€/mois'}
        </Button>
      </Section>

      <Text style={noteText}>
        Sans engagement, annulable à tout moment.
      </Text>

      <Text style={paragraph}>
        Des questions ? Répondez à cet email ou écrivez-nous sur WhatsApp.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20mon%20essai%20Qarte%20est%20termin%C3%A9%20et%20j%27aimerais%20en%20discuter">
          Nous écrire sur WhatsApp
        </Button>
      </Section>

      <Text style={signature}>
        Judicael, fondateur de Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
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
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const infoTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#78350f',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const offerBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const offerTitle = {
  color: '#4b0082',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const offerText = {
  color: '#4a5568',
  fontSize: '15px',
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

const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px dashed #4b0082',
};

const promoTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const promoPrice = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 16px 0',
};

const promoPriceOld = {
  textDecoration: 'line-through',
  color: '#8898aa',
  fontWeight: '400',
};

const promoLabel = {
  color: '#8898aa',
  fontSize: '11px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const promoCodeStyle = {
  color: '#4b0082',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '2px',
};

const promoNote = {
  color: '#4b0082',
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const noteText = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default TrialExpiredEmail;
