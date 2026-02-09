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
  const isLastChance = daysSinceCancellation >= 25;
  const isMidTerm = daysSinceCancellation >= 12 && daysSinceCancellation < 25;

  return (
    <BaseLayout preview={
      isLastChance
        ? `${shopName} — Suppression de vos données dans 5 jours`
        : isMidTerm
          ? `${shopName} — Une offre exclusive pour revenir`
          : `${shopName} — Vos clients vous attendent`
    }>
      {/* ===== J+30 : DERNIÈRE CHANCE ===== */}
      {isLastChance && (
        <>
          <Section style={urgentBanner}>
            <Text style={urgentBannerText}>SUPPRESSION DANS 5 JOURS</Text>
          </Section>

          <Heading style={urgentHeading}>
            {shopName}, vos données vont être supprimées
          </Heading>

          <Text style={paragraph}>
            Bonjour <strong>{shopName}</strong>,
          </Text>

          <Text style={paragraph}>
            Dans <strong>5 jours</strong>, votre compte Qarte sera définitivement supprimé.
            Vos clients, vos statistiques, votre programme — tout sera perdu.
          </Text>

          {totalCustomers && totalCustomers > 0 && (
            <Section style={urgentStatsBox}>
              <Text style={urgentStatsNumber}>{totalCustomers}</Text>
              <Text style={urgentStatsLabel}>
                client{totalCustomers > 1 ? 's' : ''} perdu{totalCustomers > 1 ? 's' : ''} définitivement
              </Text>
            </Section>
          )}

          <Text style={paragraph}>
            On vous propose notre <strong>meilleure offre</strong> pour sauver votre compte :
          </Text>
        </>
      )}

      {/* ===== J+14 : WIN-BACK AVEC OFFRE ===== */}
      {isMidTerm && (
        <>
          <Heading style={heading}>
            {shopName}, on a une offre pour vous
          </Heading>

          <Text style={paragraph}>
            Bonjour <strong>{shopName}</strong>,
          </Text>

          <Text style={paragraph}>
            Ça fait {daysSinceCancellation} jours que vous êtes parti.
            Vos données sont encore là, mais plus pour longtemps.
          </Text>

          {totalCustomers && totalCustomers > 0 && (
            <Section style={statsBox}>
              <Text style={statsTitle}>Vos clients attendent</Text>
              <Text style={statsNumber}>{totalCustomers}</Text>
              <Text style={statsLabel}>
                client{totalCustomers > 1 ? 's' : ''} sans accès à leur carte
              </Text>
            </Section>
          )}

          <Text style={paragraph}>
            Pour fêter votre retour, on vous offre un tarif exclusif :
          </Text>
        </>
      )}

      {/* ===== J+7 : PREMIER CONTACT ===== */}
      {!isLastChance && !isMidTerm && (
        <>
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
        </>
      )}

      {/* ===== PROMO BOX (J+14 et J+30) ===== */}
      {promoCode ? (
        <Section style={isLastChance ? urgentPromoBox : promoBox}>
          <Text style={isLastChance ? urgentPromoTitle : promoTitle}>
            {isLastChance ? 'Dernière offre' : 'Offre de retour exclusive'}
          </Text>
          <Text style={promoPrice}>
            <span style={promoPriceOld}>19€</span> → 9€/mois pendant {promoMonths} mois
          </Text>
          <Text style={promoLabel}>CODE PROMO</Text>
          <Text style={promoCodeStyled}>{promoCode}</Text>
          <Text style={promoNote}>
            -{promoMonths * 10}€ d&apos;économie sur vos {promoMonths} premiers mois
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
        <Button style={isLastChance ? urgentButton : button} href="https://getqarte.com/dashboard/subscription">
          {isLastChance
            ? `Sauver mon compte — 9€/mois`
            : promoCode
              ? `Réactiver à 9€/mois pendant ${promoMonths} mois`
              : 'Réactiver mon compte — 19€/mois'}
        </Button>
      </Section>

      {isLastChance && (
        <Text style={urgentNote}>
          Après le 5ème jour, votre compte et toutes vos données seront supprimés définitivement.
        </Text>
      )}

      <Text style={paragraph}>
        {isLastChance
          ? 'Des questions ? Écrivez-nous, on répond en quelques minutes.'
          : 'Si vous avez des questions, n\'hésitez pas à nous contacter.'}
      </Text>

      <Text style={signature}>
        À très vite,
        <br />
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

// === STYLES COMMUNS ===

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

// === STYLES OFFRE STANDARD ===

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

// === STYLES PROMO ===

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

const promoCodeStyled = {
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

// === STYLES BOUTON ===

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

// === STYLES J+30 URGENCE ===

const urgentBanner = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  padding: '12px 24px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const urgentBannerText = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const urgentHeading = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const urgentStatsBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #fca5a5',
};

const urgentStatsNumber = {
  color: '#dc2626',
  fontSize: '48px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const urgentStatsLabel = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '500',
  margin: '8px 0 0 0',
};

const urgentPromoBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px dashed #dc2626',
};

const urgentPromoTitle = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const urgentButton = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '16px 32px',
};

const urgentNote = {
  color: '#dc2626',
  fontSize: '13px',
  textAlign: 'center' as const,
  fontWeight: '500',
  margin: '0 0 24px 0',
};

export default ReactivationEmail;
