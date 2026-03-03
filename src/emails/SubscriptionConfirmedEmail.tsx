import {
  Button,
  Heading,
  Img,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface SubscriptionConfirmedEmailProps {
  shopName: string;
  nextBillingDate?: string;
  billingInterval?: 'monthly' | 'annual';
  referralCode?: string;
}

export function SubscriptionConfirmedEmail({ shopName, nextBillingDate, billingInterval, referralCode }: SubscriptionConfirmedEmailProps) {
  const planLabel = billingInterval === 'annual' ? 'Pro Annuel' : 'Pro Mensuel';
  return (
    <BaseLayout preview="Votre abonnement Qarte est activé !">
      <Heading style={heading}>
        Bienvenue parmi nos abonnés !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre abonnement Qarte est maintenant actif. Merci pour votre confiance !
      </Text>

      <Section style={confirmBox}>
        <Text style={confirmTitle}>✓ Abonnement confirmé</Text>
        <Text style={confirmDetail}>Plan {planLabel}</Text>
        <Text style={confirmNote}>
          {nextBillingDate
            ? `Prochain prélèvement le ${nextBillingDate}`
            : billingInterval === 'annual'
              ? 'Prochain prélèvement dans 1 an'
              : 'Prochain prélèvement dans 30 jours'}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Accéder à mon tableau de bord
        </Button>
      </Section>

      <Section style={nfcBox}>
        <Section style={nfcImgContainer}>
          <Img
            src="https://getqarte.com/images/Carte%20NFC%20QARTE%20.png"
            alt="Carte NFC Qarte"
            width={160}
            style={nfcImg}
          />
        </Section>
        <Text style={nfcTitle}>La carte NFC Qarte — en option (20 &euro;)</Text>
        <Text style={nfcText}>
          Passez commande via le bouton ci-dessous, ou en r&eacute;pondant &agrave; cet email. Livraison sous 1 &agrave; 2 semaines.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '12px 0 0 0' }}>
          <Button style={nfcButton} href="https://buy.stripe.com/4gM7sN6DYccX75dduH7g401">
            Commander ma carte NFC — 20 &euro;
          </Button>
        </Section>
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

const nfcBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const nfcTitle = {
  color: '#4b0082',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 10px 0',
};

const nfcText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const nfcImgContainer = {
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};

const nfcImg = {
  borderRadius: '10px',
  display: 'block',
  margin: '0 auto',
};

const nfcButton = {
  backgroundColor: '#4b0082',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

export default SubscriptionConfirmedEmail;
