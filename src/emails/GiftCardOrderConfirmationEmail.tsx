import {
  Heading,
  Text,
  Section,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface PaymentLink {
  url: string;
  label: string;
}

interface GiftCardOrderConfirmationEmailProps {
  shopName: string;
  senderFirstName: string;
  recipientFirstName: string;
  amount: string;          // pré-formaté avec devise, ex "50€"
  code: string;            // GIFT-XXXXXX
  paymentLinks: PaymentLink[];  // 1 ou 2 liens (Revolut, PayPal, etc.)
  locale?: EmailLocale;
  servicesLabel?: string | null;   // "1 coupe + 1 brushing" si kind=services
}

export function GiftCardOrderConfirmationEmail({
  shopName,
  senderFirstName,
  recipientFirstName,
  amount,
  code,
  paymentLinks,
  locale = 'fr',
  servicesLabel,
}: GiftCardOrderConfirmationEmailProps) {
  const isEn = locale === 'en';
  const giftLabel = servicesLabel || (isEn ? `${amount} gift card` : `bon cadeau de ${amount}`);
  const preview = isEn
    ? `Your ${giftLabel} for ${recipientFirstName} is on hold`
    : `Ton ${giftLabel} pour ${recipientFirstName} est en attente`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? `Your gift is on hold ✨` : `Ton bon cadeau est presque prêt ✨`}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${senderFirstName}, we've registered your ${giftLabel} for ${recipientFirstName}. To finalize, just send the payment to ${shopName} using one of the links below.`
          : `Bonjour ${senderFirstName}, on a bien noté ton ${giftLabel} pour ${recipientFirstName}. Pour finaliser, il te reste à envoyer le paiement à ${shopName} via l'un des liens ci-dessous.`}
      </Text>

      {/* Carte cadeau visuelle */}
      <Section style={giftCard}>
        <Text style={giftLabelStyle}>
          {isEn ? 'GIFT CARD' : 'BON CADEAU'}
        </Text>
        {servicesLabel ? (
          <>
            <Text style={giftServices}>{servicesLabel}</Text>
            <Text style={giftAmountSmall}>{isEn ? `Value ${amount}` : `Valeur ${amount}`}</Text>
          </>
        ) : (
          <Text style={giftAmount}>{amount}</Text>
        )}
        <Text style={giftFor}>
          {isEn ? `For ${recipientFirstName}` : `Pour ${recipientFirstName}`}
        </Text>
        <Text style={giftAt}>
          {isEn ? `Valid at ${shopName}` : `Valable chez ${shopName}`}
        </Text>
      </Section>

      {/* Référence */}
      <Section style={refBox}>
        <Text style={refLabel}>
          {isEn ? 'Reference to put as transfer note' : 'Référence à mettre en commentaire de virement'}
        </Text>
        <Text style={refCode}>{code}</Text>
        <Text style={refHint}>
          {isEn
            ? 'This helps the salon match your payment to your gift order.'
            : 'Ça permet au salon de retrouver ton paiement et ton bon en un clin d\'œil.'}
        </Text>
      </Section>

      {/* Boutons paiement */}
      <Section style={buttonsContainer}>
        <Text style={buttonsTitle}>
          {isEn ? `→ Pay ${shopName}` : `→ Régler ${shopName}`}
        </Text>
        {paymentLinks.map((link, idx) => (
          <Button
            key={idx}
            href={link.url}
            style={idx === 0 ? buttonPrimary : buttonSecondary}
          >
            {link.label}
          </Button>
        ))}
      </Section>

      <Hr style={divider} />

      <Section style={nextSteps}>
        <Text style={nextStepsTitle}>
          {isEn ? 'What happens next' : 'Et après ?'}
        </Text>
        <Text style={stepLine}>
          <span style={stepNum}>1</span>
          <span style={stepText}>
            {isEn
              ? 'Send the payment via the link above (mention the reference)'
              : 'Tu fais le paiement via le lien ci-dessus (avec la référence)'}
          </span>
        </Text>
        <Text style={stepLine}>
          <span style={stepNum}>2</span>
          <span style={stepText}>
            {isEn
              ? `${shopName} confirms receipt (usually within a day)`
              : `${shopName} confirme la réception (en général dans la journée)`}
          </span>
        </Text>
        <Text style={stepLine}>
          <span style={stepNum}>3</span>
          <span style={stepText}>
            {isEn
              ? `${recipientFirstName} receives the gift by SMS — and you'll get a confirmation email`
              : `${recipientFirstName} reçoit son bon par SMS — et tu reçois aussi un email de confirmation`}
          </span>
        </Text>
      </Section>

      <Text style={footnote}>
        {isEn
          ? 'If the salon doesn\'t confirm payment within 3 days, we\'ll automatically cancel the gift order.'
          : 'Si le salon ne confirme pas le paiement sous 3 jours, on annule automatiquement la commande.'}
      </Text>

      <Text style={signature}>
        {isEn ? 'See you soon ✨' : 'À très vite ✨'}<br />
        {isEn ? 'The Qarte team' : "L'équipe Qarte"}
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
  margin: '0 0 28px 0',
};

const giftCard = {
  background: 'linear-gradient(135deg, #4b0082 0%, #7c3aed 50%, #ec4899 100%)',
  borderRadius: '20px',
  padding: '36px 28px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const giftLabelStyle = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
};

const giftAmount = {
  color: '#ffffff',
  fontSize: '52px',
  fontWeight: '700',
  margin: '0 0 12px 0',
  letterSpacing: '-0.03em',
  lineHeight: '1',
};

const giftServices = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 6px 0',
  letterSpacing: '-0.01em',
  lineHeight: '1.2',
};

const giftAmountSmall = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0 0 12px 0',
};

const giftFor = {
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const giftAt = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '14px',
  margin: '0',
};

const refBox = {
  backgroundColor: '#FFF7ED',
  border: '2px dashed #FB923C',
  borderRadius: '14px',
  padding: '20px 24px',
  margin: '0 0 28px 0',
  textAlign: 'center' as const,
};

const refLabel = {
  color: '#9A3412',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 10px 0',
};

const refCode = {
  color: '#7C2D12',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
};

const refHint = {
  color: '#9A3412',
  fontSize: '13px',
  margin: '0',
  fontStyle: 'italic' as const,
};

const buttonsContainer = {
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
};

const buttonsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 14px 0',
  textAlign: 'left' as const,
};

const buttonPrimary = {
  backgroundColor: '#4b0082',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  display: 'inline-block' as const,
  margin: '0 0 10px 0',
  width: 'auto',
};

const buttonSecondary = {
  backgroundColor: '#ffffff',
  border: '2px solid #4b0082',
  borderRadius: '10px',
  color: '#4b0082',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 32px',
  display: 'inline-block' as const,
  margin: '0 0 10px 0',
  width: 'auto',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0 28px 0',
};

const nextSteps = {
  margin: '0 0 24px 0',
};

const nextStepsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 18px 0',
};

const stepLine = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 14px 0',
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
  gap: '14px',
};

const stepNum = {
  display: 'inline-block' as const,
  width: '28px',
  height: '28px',
  lineHeight: '28px',
  textAlign: 'center' as const,
  borderRadius: '50%',
  backgroundColor: '#4b0082',
  color: '#ffffff',
  fontWeight: '700',
  fontSize: '13px',
  flexShrink: 0,
  marginRight: '10px',
};

const stepText = {
  flex: '1',
};

const footnote = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 24px 0',
  padding: '12px 16px',
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  borderLeft: '3px solid #D1D5DB',
};

const signature = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0',
};

export default GiftCardOrderConfirmationEmail;
