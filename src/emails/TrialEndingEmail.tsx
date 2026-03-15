import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface TrialEndingEmailProps {
  shopName: string;
  daysRemaining: number;
  promoCode?: string;
}

export function TrialEndingEmail({ shopName, daysRemaining, promoCode }: TrialEndingEmailProps) {
  const isUrgent = daysRemaining <= 1;

  return (
    <BaseLayout preview={`Ton essai Qarte se termine dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}>
      <Heading style={heading}>
        Ton essai se termine bientôt
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ton essai gratuit Qarte se termine dans{' '}
        <strong style={isUrgent ? urgentText : highlight}>
          {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
        </strong>.
      </Text>

      <Section style={isUrgent ? urgentBox : infoBox}>
        <Text style={boxText}>
          {isUrgent
            ? 'Pour continuer à utiliser Qarte et conserver tes données clients, ajoute une carte bancaire dès maintenant.'
            : 'Pour continuer à fidéliser tes clients sans interruption, pense à ajouter ta carte bancaire.'}
        </Text>
        <Text style={{ ...boxText, marginTop: '12px' }}>
          Sans abonnement, tu perds l&apos;accès à ton programme fidélité, ta page publique,
          tes relances automatiques et tes données clients.
        </Text>
      </Section>

      <Section style={priceSection}>
        <Text style={priceLabel}>Abonnement Qarte</Text>
        {promoCode ? (
          <>
            <Text style={priceOld}>19€/mois</Text>
            <Text style={price}>9€<span style={priceMonth}>/mois le 1er mois</span></Text>
            <Section style={promoBox}>
              <Text style={promoLabel}>CODE PROMO</Text>
              <Text style={promoCodeStyle}>{promoCode}</Text>
              <Text style={promoNote}>-10€ sur ton premier mois</Text>
            </Section>
          </>
        ) : (
          <Text style={price}>19€<span style={priceMonth}>/mois</span></Text>
        )}
        <Text style={priceNote}>Sans engagement • Annulable à tout moment</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {promoCode ? 'Profiter de l\'offre — 9€ le 1er mois' : 'Ajouter ma carte bancaire'}
        </Button>
      </Section>

      <Section style={socialProofBox}>
        <Text style={socialProofText}>
          Des centaines de professionnels de la beauté fidélisent déjà avec Qarte.{' '}
          <a href="https://getqarte.com/pros" style={socialProofLink}>Voir leurs programmes &#8594;</a>
        </Text>
      </Section>

      <Text style={paragraph}>
        Merci de faire confiance à Qarte pour fidéliser tes clients.
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

const highlight = {
  color: '#4b0082',
};

const urgentText = {
  color: '#dc2626',
};

const infoBox = {
  backgroundColor: '#f0f4ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #dc2626',
};

const boxText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const priceSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const priceLabel = {
  color: '#8898aa',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const price = {
  color: '#1a1a1a',
  fontSize: '48px',
  fontWeight: '700',
  margin: '0',
};

const priceMonth = {
  fontSize: '18px',
  fontWeight: '400',
  color: '#8898aa',
};

const priceOld = {
  color: '#8898aa',
  fontSize: '24px',
  fontWeight: '400',
  margin: '0',
  textDecoration: 'line-through',
  textAlign: 'center' as const,
};

const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '16px 24px',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
  border: '2px dashed #4b0082',
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

const priceNote = {
  color: '#8898aa',
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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

const socialProofBox = {
  backgroundColor: '#f5f3ff',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const socialProofText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

const socialProofLink = {
  color: '#4b0082',
  fontWeight: '600' as const,
  textDecoration: 'underline',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default TrialEndingEmail;
