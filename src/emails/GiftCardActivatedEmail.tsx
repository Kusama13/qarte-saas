import {
  Heading,
  Text,
  Section,
  Button,
  Img,
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
  imageUrl?: string | null; // même PNG que dans l'email destinataire (preview)
  scheduledSendAtFormatted?: string | null;  // si renseigné = envoi destinataire différé
}

export function GiftCardActivatedEmail({
  shopName,
  senderFirstName,
  recipientFirstName,
  recipientLastName,
  amount,
  locale = 'fr',
  servicesLabel,
  pdfUrl,
  imageUrl,
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

      {/* Aperçu du bon — même PNG que celui que reçoit le destinataire */}
      {imageUrl && (
        <Section style={imageWrap}>
          <Img
            src={imageUrl}
            alt={isEn ? 'Gift voucher preview' : 'Aperçu du bon cadeau'}
            width="560"
            style={imageStyle}
          />
        </Section>
      )}

      {pdfUrl && (
        <Section style={pdfBox}>
          <Text style={pdfLabel}>
            {isEn ? 'PRINTABLE VERSION' : 'VERSION IMPRIMABLE'}
          </Text>
          <Text style={pdfHint}>
            {isEn
              ? 'Same design in PDF, ready to print and offer in person.'
              : 'Le même design en PDF, prêt à imprimer et offrir en main propre.'}
          </Text>
          <Button href={pdfUrl} style={pdfButton}>
            {isEn ? 'Download the printable PDF' : 'Télécharger le PDF imprimable'}
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

const imageWrap = {
  textAlign: 'center' as const,
  margin: '0 0 28px 0',
};

const imageStyle = {
  display: 'block',
  margin: '0 auto',
  width: '100%',
  maxWidth: '560px',
  height: 'auto',
  borderRadius: '4px',
  border: '1px solid #E8E0CC',
};

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
