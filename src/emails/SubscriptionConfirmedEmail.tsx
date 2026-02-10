import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface SubscriptionConfirmedEmailProps {
  shopName: string;
  nextBillingDate?: string;
  referralCode?: string;
}

export function SubscriptionConfirmedEmail({ shopName, nextBillingDate, referralCode }: SubscriptionConfirmedEmailProps) {
  return (
    <BaseLayout preview="Votre abonnement Qarte est activé !">
      <Heading style={heading}>
        🎉 Bienvenue parmi nos abonnés !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre abonnement Qarte est maintenant actif. Merci pour votre confiance !
      </Text>

      <Section style={confirmBox}>
        <Text style={confirmTitle}>✓ Abonnement confirmé</Text>
        <Text style={confirmDetail}>Plan Pro</Text>
        <Text style={confirmNote}>
          {nextBillingDate
            ? `Prochain prélèvement le ${nextBillingDate}`
            : 'Prochain prélèvement dans 30 jours'}
        </Text>
      </Section>

      <Section style={features}>
        <Text style={featureTitle}>Vous avez accès à :</Text>
        <Text style={featureItem}>✓ Programme de fidélité illimité</Text>
        <Text style={featureItem}>✓ Clients illimités</Text>
        <Text style={featureItem}>✓ Statistiques en temps réel</Text>
        <Text style={featureItem}>✓ Support prioritaire</Text>
        <Text style={featureItem}>✓ Mises à jour gratuites</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Accéder à mon tableau de bord
        </Button>
      </Section>

      <Text style={paragraph}>
        Une question sur votre abonnement ? Répondez à cet email, nous sommes là pour vous.
      </Text>

      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitle}>&#127873; Gagnez 10&euro; de r&eacute;duction</Text>
          <Text style={referralText}>
            Vous connaissez un(e) commer&ccedil;ant(e) dans la beaut&eacute; ?
            Recommandez-lui Qarte et recevez chacun <strong>10&euro; de r&eacute;duction</strong> sur votre prochain mois.
          </Text>
          <Text style={referralCode_style}>Votre code : <strong>{referralCode}</strong></Text>
          <Text style={referralHint}>
            Votre filleul nous communique votre code apr&egrave;s son inscription et la r&eacute;duction est appliqu&eacute;e &agrave; chacun.
          </Text>
        </Section>
      )}

      <Text style={signature}>
        Merci de faire grandir Qarte avec nous !<br />
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

const confirmBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #bbf7d0',
  textAlign: 'center' as const,
};

const confirmTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const confirmDetail = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 4px 0',
};

const confirmNote = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const features = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const featureItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
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

const referralBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const referralTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const referralText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const referralCode_style = {
  color: '#4b0082',
  fontSize: '18px',
  fontWeight: '700',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
  padding: '8px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px dashed #c4b5fd',
};

const referralHint = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};

export default SubscriptionConfirmedEmail;
