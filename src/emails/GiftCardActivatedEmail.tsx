import {
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface GiftCardActivatedEmailProps {
  shopName: string;
  senderFirstName: string;
  recipientFirstName: string;
  amount: string;
  expiresAtFormatted: string;  // ex "30 avril 2027"
  locale?: EmailLocale;
  servicesLabel?: string | null;
}

export function GiftCardActivatedEmail({
  shopName,
  senderFirstName,
  recipientFirstName,
  amount,
  expiresAtFormatted,
  locale = 'fr',
  servicesLabel,
}: GiftCardActivatedEmailProps) {
  const isEn = locale === 'en';
  const giftLabel = servicesLabel || (isEn ? `${amount} gift card` : `bon cadeau de ${amount}`);
  const preview = isEn
    ? `${recipientFirstName} just received your ${giftLabel}`
    : `${recipientFirstName} vient de recevoir ton ${giftLabel}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'Your gift is on its way 🎁' : 'Ton bon cadeau est parti 🎁'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${senderFirstName}, ${shopName} just confirmed your payment. ${recipientFirstName} is receiving an SMS right now with their ${giftLabel}.`
          : `Bonjour ${senderFirstName}, ${shopName} vient de confirmer la réception de ton paiement. ${recipientFirstName} reçoit son ${giftLabel} par SMS dans la foulée.`}
      </Text>

      <Section style={successBox}>
        <Text style={successIcon}>✨</Text>
        <Text style={successTitle}>
          {isEn ? `Gift delivered to ${recipientFirstName}` : `Bon envoyé à ${recipientFirstName}`}
        </Text>
        <Text style={successDetail}>
          {isEn
            ? `${servicesLabel ? `${servicesLabel} (${amount})` : amount} · valid until ${expiresAtFormatted}`
            : `${servicesLabel ? `${servicesLabel} (${amount})` : amount} · valable jusqu'au ${expiresAtFormatted}`}
        </Text>
      </Section>

      <Text style={paragraph}>
        {isEn
          ? `We'll let you know as soon as ${recipientFirstName} uses the gift, so you can share the moment with them.`
          : `On te préviendra dès que ${recipientFirstName} utilisera son bon, comme ça tu pourras partager le moment avec elle.`}
      </Text>

      <Text style={signature}>
        {isEn ? 'Thanks for choosing Qarte for this beautiful gesture' : 'Merci d\'avoir choisi Qarte pour ce beau geste'}<br />
        <span style={signatureHighlight}>
          {isEn ? 'The Qarte team 💜' : 'L\'équipe Qarte 💜'}
        </span>
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '26px',
  fontWeight: '600',
  lineHeight: '1.2',
  margin: '0 0 20px 0',
  letterSpacing: '-0.02em',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const successBox = {
  background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
  border: '2px solid #10B981',
  borderRadius: '16px',
  padding: '28px 24px',
  margin: '0 0 28px 0',
  textAlign: 'center' as const,
};

const successIcon = {
  fontSize: '36px',
  margin: '0 0 8px 0',
  lineHeight: '1',
};

const successTitle = {
  color: '#065F46',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  letterSpacing: '-0.01em',
};

const successDetail = {
  color: '#047857',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '32px 0 0 0',
};

const signatureHighlight = {
  color: '#4b0082',
  fontWeight: '600',
};

export default GiftCardActivatedEmail;
