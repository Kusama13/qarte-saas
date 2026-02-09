import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ReactivationEmailProps {
  shopName: string;
  daysSinceCancellation: number;
  totalCustomers?: number;
  promoCode?: string;
  promoMonths?: number;
}

export function ReactivationEmail({
  shopName,
  daysSinceCancellation,
  totalCustomers,
  promoCode,
  promoMonths = 1
}: ReactivationEmailProps) {
  return (
    <BaseLayout preview={`${shopName} - Vos clients vous attendent`}>
      <Heading style={heading}>
        {shopName}, vos clients vous attendent
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Cela fait {daysSinceCancellation} jours que vous avez quitté Qarte.
        Nous espérons que tout va bien de votre côté.
      </Text>

      {totalCustomers && totalCustomers > 0 && (
        <Section style={statsBox}>
          <Text style={statsTitle}>Pendant votre absence...</Text>
          <Text style={statsNumber}>{totalCustomers}</Text>
          <Text style={statsLabel}>
            client{totalCustomers > 1 ? 's' : ''} inscrit{totalCustomers > 1 ? 's' : ''} dans votre programme
          </Text>
          <Text style={statsText}>
            Vos clients fidèles n&apos;ont plus accès à leur carte de fidélité.
          </Text>
        </Section>
      )}

      <Section style={benefitsSection}>
        <Text style={benefitsTitle}>Ce qui vous attend sur Qarte :</Text>
        <Text style={benefitItem}>✓ Programme de fidélité 100% digital</Text>
        <Text style={benefitItem}>✓ QR code unique pour votre commerce</Text>
        <Text style={benefitItem}>✓ Notifications push pour fidéliser vos clients</Text>
        <Text style={benefitItem}>✓ Statistiques en temps réel</Text>
        <Text style={benefitItem}>✓ Support prioritaire</Text>
      </Section>

      {promoCode ? (
        <Section style={promoBox}>
          <Text style={promoTitle}>Offre de retour exclusive</Text>
          <Text style={promoPrice}>
            <span style={promoPriceOld}>19€</span> → 9€/mois pendant {promoMonths} mois
          </Text>
          <Text style={promoLabel}>CODE PROMO</Text>
          <Text style={promoCodeStyle}>{promoCode}</Text>
          <Text style={promoNote}>
            -{promoMonths * 10}€ d&apos;économie sur {promoMonths === 1 ? 'votre premier mois' : `vos ${promoMonths} premiers mois`}
          </Text>
        </Section>
      ) : (
        <Section style={offerBox}>
          <Text style={offerTitle}>Offre de retour</Text>
          <Text style={offerText}>
            Réactivez votre compte aujourd&apos;hui et retrouvez toutes vos données clients intactes.
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {promoCode
            ? `Réactiver à 9€/mois pendant ${promoMonths} mois`
            : 'Réactiver mon compte - 19€/mois'}
        </Button>
      </Section>

      <Text style={paragraph}>
        Si vous avez des questions ou si vous rencontrez des difficultés,
        n&apos;hésitez pas à nous contacter. Nous sommes là pour vous aider.
      </Text>

      <Text style={signature}>
        À très bientôt,
        <br />
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#4b0082',
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

const statsBox = {
  backgroundColor: '#eef2ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #c7d2fe',
};

const statsTitle = {
  color: '#4338ca',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const statsNumber = {
  color: '#4b0082',
  fontSize: '48px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const statsLabel = {
  color: '#4338ca',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px 0',
};

const statsText = {
  color: '#6366f1',
  fontSize: '14px',
  margin: '0',
};

const benefitsSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #bbf7d0',
};

const benefitsTitle = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const benefitItem = {
  color: '#15803d',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const offerBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #fde68a',
  textAlign: 'center' as const,
};

const offerTitle = {
  color: '#b45309',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const offerText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ReactivationEmail;
