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

interface GiftCardReceivedEmailProps {
  shopName: string;
  senderFirstName: string;
  recipientFirstName: string;
  amount: string;
  senderMessage?: string | null;
  expiresAtFormatted: string;
  cardUrl: string;          // /customer/card/[merchantId]
  shopAddress?: string | null;
  primaryColor?: string;    // pour la carte gradient
  secondaryColor?: string;
  locale?: EmailLocale;
  servicesLabel?: string | null;
  serviceNames?: string[];
}

export function GiftCardReceivedEmail({
  shopName,
  senderFirstName,
  recipientFirstName,
  amount,
  senderMessage,
  expiresAtFormatted,
  cardUrl,
  shopAddress,
  primaryColor = '#4b0082',
  secondaryColor = '#ec4899',
  locale = 'fr',
  servicesLabel,
  serviceNames,
}: GiftCardReceivedEmailProps) {
  const isEn = locale === 'en';
  const giftDescription = servicesLabel || (isEn ? `${amount} gift card` : `bon cadeau de ${amount}`);
  const preview = isEn
    ? `${senderFirstName} is offering you ${giftDescription} at ${shopName}`
    : `${senderFirstName} t'offre ${giftDescription} chez ${shopName}`;

  // Carte gradient personnalisée aux couleurs du merchant
  const cardGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn
          ? `${senderFirstName} is offering you a gift ✨`
          : `${senderFirstName} te fait un cadeau ✨`}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${recipientFirstName}, you've just been offered a ${servicesLabel ? 'gift' : 'gift card'} to enjoy a moment at ${shopName}.`
          : `Bonjour ${recipientFirstName}, on t'offre un ${servicesLabel ? 'cadeau' : 'bon cadeau'} pour profiter d'un moment chez ${shopName}.`}
      </Text>

      {/* Carte cadeau visuelle — gradient merchant */}
      <Section style={{ ...giftCardWrap, background: cardGradient }}>
        <Text style={giftLabel}>
          {isEn ? '✦ GIFT CARD ✦' : '✦ BON CADEAU ✦'}
        </Text>
        {servicesLabel ? (
          <>
            <Text style={giftServices}>{servicesLabel}</Text>
            <Text style={giftAmountSmall}>{isEn ? `Value ${amount}` : `Valeur ${amount}`}</Text>
          </>
        ) : (
          <Text style={giftAmount}>{amount}</Text>
        )}
        <Text style={giftFor}>{shopName}</Text>
        {shopAddress && (
          <Text style={giftAddress}>{shopAddress}</Text>
        )}
        <Hr style={giftDivider} />
        <Text style={giftFromLabel}>
          {isEn ? 'OFFERED BY' : 'OFFERT PAR'}
        </Text>
        <Text style={giftFrom}>{senderFirstName}</Text>
      </Section>

      {/* Liste détaillée des prestations si plusieurs */}
      {serviceNames && serviceNames.length > 1 && (
        <Section style={servicesList}>
          <Text style={servicesListTitle}>
            {isEn ? 'Included in your gift' : 'Inclus dans ton cadeau'}
          </Text>
          {serviceNames.map((name, idx) => (
            <Text key={idx} style={servicesListItem}>
              <span style={servicesListBullet}>✦</span> {name}
            </Text>
          ))}
        </Section>
      )}

      {senderMessage && (
        <Section style={messageBox}>
          <Text style={messageQuote}>"</Text>
          <Text style={messageText}>{senderMessage}</Text>
          <Text style={messageSign}>— {senderFirstName}</Text>
        </Section>
      )}

      <Section style={ctaContainer}>
        <Button href={cardUrl} style={{ ...ctaButton, backgroundColor: primaryColor }}>
          {isEn ? 'See my gift card' : 'Voir mon bon cadeau'}
        </Button>
        <Text style={ctaHint}>
          {isEn
            ? 'Your gift is saved in your loyalty card. Show it at the salon to use it.'
            : 'Ton bon est dans ta carte fidélité. Présente-le au salon pour en profiter.'}
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={detailsBox}>
        <Text style={detailLine}>
          <strong>{isEn ? 'Gift:' : 'Cadeau :'}</strong> {servicesLabel || amount}
        </Text>
        {servicesLabel && (
          <Text style={detailLine}>
            <strong>{isEn ? 'Value:' : 'Valeur :'}</strong> {amount}
          </Text>
        )}
        <Text style={detailLine}>
          <strong>{isEn ? 'Salon:' : 'Salon :'}</strong> {shopName}
        </Text>
        <Text style={detailLine}>
          <strong>{isEn ? 'Valid until:' : 'Valable jusqu\'au :'}</strong> {expiresAtFormatted}
        </Text>
      </Section>

      <Text style={signature}>
        {isEn
          ? `Enjoy your moment at ${shopName} ✨`
          : `Profite bien de ton moment chez ${shopName} ✨`}<br />
        <span style={signatureHighlight}>
          {isEn ? 'The Qarte team' : 'L\'équipe Qarte'}
        </span>
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '28px',
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

const giftCardWrap = {
  borderRadius: '24px',
  padding: '40px 32px',
  margin: '0 0 28px 0',
  textAlign: 'center' as const,
  boxShadow: '0 20px 40px -12px rgba(75, 0, 130, 0.3)',
};

const giftLabel = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '3px',
  margin: '0 0 16px 0',
};

const giftAmount = {
  color: '#ffffff',
  fontSize: '60px',
  fontWeight: '700',
  margin: '0 0 16px 0',
  letterSpacing: '-0.04em',
  lineHeight: '1',
  textShadow: '0 2px 8px rgba(0,0,0,0.15)',
};

const giftServices = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 6px 0',
  letterSpacing: '-0.01em',
  lineHeight: '1.25',
  textShadow: '0 2px 8px rgba(0,0,0,0.15)',
};

const giftAmountSmall = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0 0 14px 0',
  letterSpacing: '0.02em',
};

const servicesList = {
  margin: '0 0 24px 0',
  padding: '18px 22px',
  backgroundColor: '#FAF8FF',
  border: '1px solid #E9E2FB',
  borderRadius: '14px',
};

const servicesListTitle = {
  color: '#6D28D9',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px 0',
};

const servicesListItem = {
  color: '#1F2937',
  fontSize: '15px',
  fontWeight: '500',
  margin: '0 0 6px 0',
  lineHeight: '1.5',
};

const servicesListBullet = {
  color: '#A78BFA',
  marginRight: '6px',
};

const giftFor = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  letterSpacing: '-0.01em',
};

const giftAddress = {
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '13px',
  margin: '0 0 16px 0',
};

const giftDivider = {
  borderTop: '1px solid rgba(255, 255, 255, 0.3)',
  margin: '20px 0 16px 0',
};

const giftFromLabel = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 6px 0',
};

const giftFrom = {
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: '600',
  margin: '0',
  fontStyle: 'italic' as const,
};

const messageBox = {
  backgroundColor: '#FAF5FF',
  border: '1px solid #E9D5FF',
  borderRadius: '14px',
  padding: '24px 28px',
  margin: '0 0 28px 0',
  position: 'relative' as const,
};

const messageQuote = {
  color: '#A78BFA',
  fontSize: '48px',
  fontFamily: 'Georgia, serif',
  lineHeight: '0.5',
  margin: '0 0 8px 0',
  fontWeight: '700',
};

const messageText = {
  color: '#4C1D95',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
  fontStyle: 'italic' as const,
};

const messageSign = {
  color: '#7C3AED',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'right' as const,
};

const ctaContainer = {
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
};

const ctaButton = {
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '16px 36px',
  display: 'inline-block' as const,
};

const ctaHint = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '14px 0 0 0',
  fontStyle: 'italic' as const,
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '0 0 24px 0',
};

const detailsBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const detailLine = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0',
};

const signatureHighlight = {
  color: '#4b0082',
  fontWeight: '600',
};

export default GiftCardReceivedEmail;
