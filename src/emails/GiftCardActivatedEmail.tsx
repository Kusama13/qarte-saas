import {
  Heading,
  Text,
  Section,
  Button,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface GiftCardActivatedEmailProps {
  shopName: string;
  senderFirstName: string;
  recipientFirstName: string;
  recipientLastName?: string | null;
  amount: string;
  expiresAtFormatted: string;
  locale?: EmailLocale;
  servicesLabel?: string | null;
  pdfUrl?: string | null;
  scheduledSendAtFormatted?: string | null;  // si renseigné = envoi destinataire différé
}

export function GiftCardActivatedEmail({
  shopName,
  senderFirstName,
  recipientFirstName,
  recipientLastName,
  amount,
  expiresAtFormatted,
  locale = 'fr',
  servicesLabel,
  pdfUrl,
  scheduledSendAtFormatted,
}: GiftCardActivatedEmailProps) {
  const isEn = locale === 'en';
  const giftLabel = servicesLabel || (isEn ? `${amount} gift card` : `bon cadeau de ${amount}`);
  const recipientFullName = recipientLastName ? `${recipientFirstName} ${recipientLastName}` : recipientFirstName;
  const isScheduled = Boolean(scheduledSendAtFormatted);
  const preview = isScheduled
    ? (isEn
        ? `Your ${giftLabel} for ${recipientFullName} is scheduled for ${scheduledSendAtFormatted}`
        : `Ton ${giftLabel} pour ${recipientFullName} est programmé pour le ${scheduledSendAtFormatted}`)
    : (isEn
        ? `${recipientFullName} just received your ${giftLabel}`
        : `${recipientFullName} vient de recevoir ton ${giftLabel}`);

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isScheduled
          ? (isEn ? 'Your gift is scheduled 🎁' : 'Ton bon cadeau est programmé 🎁')
          : (isEn ? 'Your gift is on its way 🎁' : 'Ton bon cadeau est parti 🎁')}
      </Heading>

      <Text style={paragraph}>
        {isScheduled
          ? (isEn
              ? `Hi ${senderFirstName}, ${shopName} just confirmed your payment. ${recipientFullName} will receive their ${giftLabel} on ${scheduledSendAtFormatted}.`
              : `Bonjour ${senderFirstName}, ${shopName} vient de confirmer la réception de ton paiement. ${recipientFullName} recevra son ${giftLabel} le ${scheduledSendAtFormatted}.`)
          : (isEn
              ? `Hi ${senderFirstName}, ${shopName} just confirmed your payment. ${recipientFullName} is receiving an SMS right now with their ${giftLabel}.`
              : `Bonjour ${senderFirstName}, ${shopName} vient de confirmer la réception de ton paiement. ${recipientFullName} reçoit son ${giftLabel} par SMS dans la foulée.`)}
      </Text>

      <Section style={isScheduled ? scheduledBox : successBox}>
        <Text style={isScheduled ? scheduledIcon : successIcon}>{isScheduled ? '📅' : '✨'}</Text>
        <Text style={isScheduled ? scheduledTitle : successTitle}>
          {isScheduled
            ? (isEn ? `Sending on ${scheduledSendAtFormatted}` : `Envoi le ${scheduledSendAtFormatted}`)
            : (isEn ? `Gift delivered to ${recipientFullName}` : `Bon envoyé à ${recipientFullName}`)}
        </Text>
        <Text style={isScheduled ? scheduledDetail : successDetail}>
          {isEn
            ? `${servicesLabel ? `${servicesLabel} (${amount})` : amount} · valid until ${expiresAtFormatted}`
            : `${servicesLabel ? `${servicesLabel} (${amount})` : amount} · valable jusqu'au ${expiresAtFormatted}`}
        </Text>
      </Section>

      {pdfUrl && (
        <Section style={pdfBox}>
          <Text style={pdfLabel}>
            {isEn ? '🎁 PRINTABLE GIFT CARD' : '🎁 BON CADEAU IMPRIMABLE'}
          </Text>
          <Text style={pdfHint}>
            {isEn
              ? 'A nicely-designed PDF you can print and offer in person, if you want.'
              : 'Un PDF joliment mis en page que tu peux imprimer et offrir en main propre, si tu veux.'}
          </Text>
          <Button href={pdfUrl} style={pdfButton}>
            {isEn ? 'Download the PDF' : 'Télécharger le PDF'}
          </Button>
        </Section>
      )}

      <Text style={paragraph}>
        {isEn
          ? `We'll let you know as soon as ${recipientFullName} uses the gift, so you can share the moment with them.`
          : `On te préviendra dès que ${recipientFullName} utilisera son bon, comme ça tu pourras partager le moment avec elle.`}
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

const scheduledBox = {
  background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF4FF 100%)',
  border: '2px solid #A78BFA',
  borderRadius: '16px',
  padding: '28px 24px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const scheduledIcon = {
  fontSize: '32px',
  margin: '0 0 8px 0',
  lineHeight: '1',
};

const scheduledTitle = {
  color: '#5B21B6',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  letterSpacing: '-0.01em',
};

const scheduledDetail = {
  color: '#6D28D9',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const pdfBox = {
  margin: '0 0 28px 0',
  padding: '20px 24px',
  backgroundColor: '#FFF7ED',
  border: '1px solid #FED7AA',
  borderRadius: '14px',
  textAlign: 'center' as const,
};

const pdfLabel = {
  color: '#9A3412',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px 0',
};

const pdfHint = {
  color: '#7C2D12',
  fontSize: '13px',
  margin: '0 0 14px 0',
  lineHeight: '1.5',
};

const pdfButton = {
  backgroundColor: '#9A3412',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
  display: 'inline-block' as const,
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
