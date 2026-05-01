import {
  Heading,
  Text,
  Section,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import type { EmailLocale } from './translations';

interface GiftCardMerchantNotificationEmailProps {
  shopName: string;
  senderFirstName: string;
  senderLastName?: string | null;
  senderEmail: string;
  senderPhoneFormatted: string;
  recipientFirstName: string;
  recipientLastName?: string | null;
  recipientPhoneFormatted: string;
  amount: string;
  code: string;
  senderMessage?: string | null;
  servicesLabel?: string | null;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

export function GiftCardMerchantNotificationEmail({
  shopName,
  senderFirstName,
  senderEmail,
  senderPhoneFormatted,
  recipientFirstName,
  recipientPhoneFormatted,
  amount,
  code,
  senderLastName,
  recipientLastName,
  senderMessage,
  servicesLabel,
  dashboardUrl = 'https://getqarte.com/dashboard/gift-cards',
  locale = 'fr',
}: GiftCardMerchantNotificationEmailProps) {
  const isEn = locale === 'en';
  const giftLabel = servicesLabel || (isEn ? `${amount} gift card` : `bon cadeau de ${amount}`);
  const senderFullName = senderLastName ? `${senderFirstName} ${senderLastName}` : senderFirstName;
  const recipientFullName = recipientLastName ? `${recipientFirstName} ${recipientLastName}` : recipientFirstName;
  const preview = isEn
    ? `New ${giftLabel} order from ${senderFullName}`
    : `Nouvelle commande ${giftLabel} de ${senderFullName}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? `New ${giftLabel} order 🎁` : `Nouvelle commande ${giftLabel} 🎁`}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${shopName}, ${senderFullName} just ordered a ${giftLabel} for ${recipientFullName} from your page.`
          : `Bonjour ${shopName}, ${senderFullName} vient de commander un ${giftLabel} pour ${recipientFullName} depuis ta page.`}
      </Text>

      {/* Référence à attendre */}
      <Section style={refBox}>
        <Text style={refLabel}>
          {isEn ? 'PAYMENT REFERENCE' : 'RÉFÉRENCE PAIEMENT'}
        </Text>
        <Text style={refCode}>{code}</Text>
        <Text style={refHint}>
          {isEn
            ? `${senderFullName} should put this reference in the transfer note when paying`
            : `${senderFullName} devrait mettre cette référence en commentaire de virement`}
        </Text>
      </Section>

      {/* Détails commande */}
      <Section style={detailsBox}>
        <Text style={detailsTitle}>
          {isEn ? 'Order details' : 'Détails de la commande'}
        </Text>

        {servicesLabel ? (
          <>
            <Text style={detailLine}>
              <strong>{isEn ? 'Gift:' : 'Cadeau :'}</strong> <span style={amountValue}>{servicesLabel}</span>
            </Text>
            <Text style={detailLine}>
              <strong>{isEn ? 'Total to receive:' : 'Total à percevoir :'}</strong> {amount}
            </Text>
          </>
        ) : (
          <Text style={detailLine}>
            <strong>{isEn ? 'Amount:' : 'Montant :'}</strong> <span style={amountValue}>{amount}</span>
          </Text>
        )}

        <Hr style={miniDivider} />

        <Text style={sectionLabel}>
          {isEn ? 'BUYER' : 'OFFREUR / OFFREUSE'}
        </Text>
        <Text style={detailLine}>
          <strong>{senderFullName}</strong>
        </Text>
        <Text style={detailLine}>
          📧 <a href={`mailto:${senderEmail}`} style={emailLink}>{senderEmail}</a>
        </Text>
        <Text style={detailLine}>
          📱 {senderPhoneFormatted}
        </Text>

        <Hr style={miniDivider} />

        <Text style={sectionLabel}>
          {isEn ? 'RECIPIENT' : 'DESTINATAIRE'}
        </Text>
        <Text style={detailLine}>
          <strong>{recipientFullName}</strong>
        </Text>
        <Text style={detailLine}>
          📱 {recipientPhoneFormatted}
        </Text>
      </Section>

      {senderMessage && (
        <Section style={messageBox}>
          <Text style={messageLabel}>
            {isEn ? 'Personal note from buyer' : 'Mot personnel de l\'offreur'}
          </Text>
          <Text style={messageText}>"{senderMessage}"</Text>
        </Section>
      )}

      {/* Action */}
      <Section style={actionBox}>
        <Text style={actionTitle}>
          {isEn ? 'What to do' : 'Ce qu\'il te reste à faire'}
        </Text>
        <Text style={actionStep}>
          1. {isEn
            ? `Wait for ${senderFullName}'s payment via your link (Revolut, PayPal…)`
            : `Attends le paiement de ${senderFullName} via ton lien (Revolut, PayPal…)`}
        </Text>
        <Text style={actionStep}>
          2. {isEn
            ? `Check the transfer note matches reference ${code}`
            : `Vérifie que le commentaire correspond bien à la référence ${code}`}
        </Text>
        <Text style={actionStep}>
          3. {isEn
            ? `Click "Mark as paid" in your dashboard — we'll send the gift to ${recipientFullName} by SMS`
            : `Clique "Marquer payé" dans le dashboard — on envoie le bon à ${recipientFullName} par SMS`}
        </Text>

        <Button href={dashboardUrl} style={ctaButton}>
          {isEn ? 'Open the dashboard' : 'Ouvrir le dashboard'}
        </Button>
      </Section>

      <Text style={footnote}>
        {isEn
          ? 'If no payment arrives within 3 days, the order is automatically cancelled and the buyer is notified.'
          : 'Sans paiement reçu sous 3 jours, la commande est automatiquement annulée et l\'offreur prévenu.'}
      </Text>

      <EmailSignoff>{isEn ? 'The Qarte team 💜' : "L'équipe Qarte 💜"}</EmailSignoff>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px 0',
  letterSpacing: '-0.01em',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 28px 0',
};

const refBox = {
  backgroundColor: '#FFF7ED',
  border: '2px dashed #FB923C',
  borderRadius: '14px',
  padding: '22px 24px',
  margin: '0 0 28px 0',
  textAlign: 'center' as const,
};

const refLabel = {
  color: '#9A3412',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  margin: '0 0 10px 0',
};

const refCode = {
  color: '#7C2D12',
  fontSize: '30px',
  fontWeight: '800',
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
};

const refHint = {
  color: '#9A3412',
  fontSize: '12px',
  margin: '0',
  fontStyle: 'italic' as const,
};

const detailsBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '14px',
  padding: '24px 28px',
  margin: '0 0 24px 0',
};

const detailsTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px 0',
};

const sectionLabel = {
  color: '#6B7280',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  margin: '4px 0 8px 0',
};

const detailLine = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 6px 0',
};

const amountValue = {
  color: '#4b0082',
  fontWeight: '700',
  fontSize: '18px',
};

const emailLink = {
  color: '#4b0082',
  textDecoration: 'underline',
};

const miniDivider = {
  borderTop: '1px solid #E5E7EB',
  margin: '14px 0',
};

const messageBox = {
  backgroundColor: '#FAF5FF',
  border: '1px solid #E9D5FF',
  borderRadius: '12px',
  padding: '18px 22px',
  margin: '0 0 28px 0',
};

const messageLabel = {
  color: '#7C3AED',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const messageText = {
  color: '#4C1D95',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  fontStyle: 'italic' as const,
};

const actionBox = {
  backgroundColor: '#F0F9FF',
  border: '1px solid #BAE6FD',
  borderRadius: '14px',
  padding: '24px 28px',
  margin: '0 0 24px 0',
};

const actionTitle = {
  color: '#0C4A6E',
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 14px 0',
};

const actionStep = {
  color: '#075985',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 10px 0',
};

const ctaButton = {
  backgroundColor: '#0284C7',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  display: 'inline-block' as const,
  margin: '14px 0 0 0',
};

const footnote = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
  padding: '10px 14px',
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  borderLeft: '3px solid #D1D5DB',
};

export default GiftCardMerchantNotificationEmail;
