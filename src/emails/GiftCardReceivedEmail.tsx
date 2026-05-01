import {
  Heading,
  Text,
  Section,
  Button,
  Img,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface GiftCardReceivedEmailProps {
  shopName: string;
  senderFirstName: string;
  senderLastName?: string | null;
  recipientFirstName: string;
  recipientLastName?: string | null;
  amount: string;
  senderMessage?: string | null;
  expiresAtFormatted: string;
  cardUrl: string;
  primaryColor?: string;
  locale?: EmailLocale;
  servicesLabel?: string | null;
  imageUrl?: string | null; // PNG Satori — quand absent, fallback texte
  code?: string;
  bookingUrl?: string | null; // si le merchant a auto_booking_enabled
}

/**
 * Email reçu par le destinataire d'un bon cadeau.
 *
 * Le visuel principal est une image PNG (rendu Satori partagé avec le PDF
 * imprimable). L'email se contente d'un cadre sobre autour : salutation,
 * image, CTA, détails techniques. Tout l'émotionnel passe dans l'image.
 */
export function GiftCardReceivedEmail({
  shopName,
  senderFirstName,
  recipientFirstName,
  amount,
  expiresAtFormatted,
  cardUrl,
  primaryColor = '#4b0082',
  locale = 'fr',
  servicesLabel,
  imageUrl,
  code,
  bookingUrl,
}: GiftCardReceivedEmailProps) {
  const isEn = locale === 'en';
  const giftDescription = servicesLabel || (isEn ? `a ${amount} gift card` : `un bon cadeau de ${amount}`);
  const preview = isEn
    ? `${senderFirstName} is offering you ${giftDescription} at ${shopName}`
    : `${senderFirstName} t'offre ${giftDescription} chez ${shopName}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn
          ? `${recipientFirstName}, you've received a gift`
          : `${recipientFirstName}, tu reçois un cadeau`}
      </Heading>

      <Text style={intro}>
        {isEn
          ? `${senderFirstName} is offering you a moment at ${shopName}.`
          : `${senderFirstName} t'offre un moment chez ${shopName}.`}
      </Text>

      {imageUrl ? (
        <Section style={imageWrap}>
          <Img
            src={imageUrl}
            alt={isEn ? 'Your gift voucher' : 'Ton bon cadeau'}
            width="560"
            style={imageStyle}
          />
        </Section>
      ) : (
        // Fallback minimal si le PNG n'a pas pu être généré
        <Section style={fallbackWrap}>
          <Text style={fallbackLabel}>
            {isEn ? 'GIFT VOUCHER' : 'BON CADEAU'}
          </Text>
          <Text style={fallbackAmount}>{servicesLabel || amount}</Text>
          <Text style={fallbackSalon}>{shopName}</Text>
        </Section>
      )}

      <Section style={ctaContainer}>
        {bookingUrl ? (
          <Row>
            <Column style={ctaCellLeft}>
              <Button href={bookingUrl} style={{ ...ctaButton, backgroundColor: primaryColor, color: '#ffffff' }}>
                {isEn ? 'Book' : 'Réserver'}
              </Button>
            </Column>
            <Column style={ctaCellRight}>
              <Button
                href={cardUrl}
                style={{ ...ctaButton, backgroundColor: '#FAF1DD', color: '#3D2515', border: '1px solid #E8DCC0' }}
              >
                {isEn ? 'My voucher' : 'Mon bon'}
              </Button>
            </Column>
          </Row>
        ) : (
          <Button href={cardUrl} style={{ ...ctaButton, backgroundColor: primaryColor, color: '#ffffff' }}>
            {isEn ? 'Open my gift voucher' : 'Ouvrir mon bon cadeau'}
          </Button>
        )}
        <Text style={ctaHint}>
          {isEn
            ? 'Saved in your loyalty card. Show it at the salon to use it.'
            : 'Enregistré dans ta carte fidélité. Présente-le au salon pour en profiter.'}
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={detailsBox}>
        <Text style={detailLine}>
          <span style={detailLabel}>{isEn ? 'Salon' : 'Salon'}</span> {shopName}
        </Text>
        <Text style={detailLine}>
          <span style={detailLabel}>{isEn ? 'Valid until' : 'Valable jusqu\'au'}</span> {expiresAtFormatted}
        </Text>
        {code && (
          <Text style={detailLine}>
            <span style={detailLabel}>Code</span>{' '}
            <span style={codeStyle}>{code}</span>
          </Text>
        )}
      </Section>

      <Text style={signature}>
        {isEn ? 'Enjoy your moment' : 'Profite bien de ton moment'}<br />
        <span style={signatureHighlight}>
          {isEn ? 'The Qarte team 💜' : 'L\'équipe Qarte 💜'}
        </span>
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1F1A14',
  fontSize: '26px',
  fontWeight: '600',
  lineHeight: '1.25',
  margin: '0 0 14px 0',
  letterSpacing: '-0.015em',
};

const intro = {
  color: '#5A5142',
  fontSize: '15px',
  lineHeight: '1.55',
  margin: '0 0 28px 0',
};

const imageWrap = {
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
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

const fallbackWrap = {
  textAlign: 'center' as const,
  padding: '40px 24px',
  backgroundColor: '#F5EFE0',
  border: '1px solid #E8E0CC',
  borderRadius: '4px',
  margin: '0 0 32px 0',
};

const fallbackLabel = {
  color: '#5A5142',
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '4px',
  margin: '0 0 16px 0',
};

const fallbackAmount = {
  color: '#1F1A14',
  fontSize: '32px',
  fontStyle: 'italic' as const,
  margin: '0 0 8px 0',
  fontFamily: 'Georgia, serif',
};

const fallbackSalon = {
  color: '#5A5142',
  fontSize: '13px',
  margin: '0',
};

const ctaContainer = {
  textAlign: 'center' as const,
  margin: '0 0 32px 0',
};

const ctaButton = {
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 16px',
  display: 'block' as const,
  width: '100%',
  boxSizing: 'border-box' as const,
};

// Cellules table-based pour mettre les 2 boutons côte-à-côte (Outlook-safe).
// Le gap est créé via padding-right/left de 5px (= gap 10px total entre cellules).
const ctaCellLeft = {
  width: '50%',
  paddingRight: '5px',
  verticalAlign: 'top' as const,
};

const ctaCellRight = {
  width: '50%',
  paddingLeft: '5px',
  verticalAlign: 'top' as const,
};

const ctaHint = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '12px 0 0 0',
};

const divider = {
  borderTop: '1px solid #E8E0CC',
  margin: '0 0 24px 0',
};

const detailsBox = {
  margin: '0 0 24px 0',
};

const detailLine = {
  color: '#1F1A14',
  fontSize: '13px',
  lineHeight: '1.7',
  margin: '0 0 4px 0',
};

const detailLabel = {
  color: '#5A5142',
  fontSize: '11px',
  fontWeight: '500',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  marginRight: '8px',
};

const codeStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontSize: '13px',
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

export default GiftCardReceivedEmail;
