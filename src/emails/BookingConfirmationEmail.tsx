import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import type { EmailLocale } from './translations';

interface ServiceDetail {
  name: string;
  price: number;
  duration: number;
}

interface DepositLink {
  label: string | null;
  url: string;
}

interface BookingConfirmationEmailProps {
  shopName: string;
  clientFirstName: string;
  date: string;
  time: string;
  services: ServiceDetail[];
  totalDuration: number;
  totalPrice: number;
  currency?: 'EUR' | 'CHF';
  customerAddress?: string | null;
  deposit?: {
    amount: number | null;
    percent: number | null;
    deadlineHours: number | null;
    links: DepositLink[];
  } | null;
  loyaltyCardUrl: string;
  cancelPolicyDays?: number | null;
  reschedulePolicyDays?: number | null;
  locale?: EmailLocale;
}

function formatDurationEmail(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function formatPriceEmail(amount: number, currency: 'EUR' | 'CHF', isEn: boolean): string {
  if (currency === 'CHF') return `${amount} CHF`;
  return isEn ? `EUR ${amount}` : `${amount} €`;
}

export function BookingConfirmationEmail({
  shopName,
  clientFirstName,
  date,
  time,
  services,
  totalDuration,
  totalPrice,
  currency = 'EUR',
  customerAddress,
  deposit,
  loyaltyCardUrl,
  cancelPolicyDays,
  reschedulePolicyDays,
  locale = 'fr',
}: BookingConfirmationEmailProps) {
  const isEn = locale === 'en';
  const hasDeposit = !!(deposit && deposit.links.length > 0);
  const isHomeService = !!customerAddress;

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(
    isEn ? 'en-US' : 'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  const preview = hasDeposit
    ? (isEn
        ? `Booking pending — pay your deposit at ${shopName}`
        : `Réservation en attente — réglez votre acompte chez ${shopName}`)
    : (isEn
        ? `Booking confirmed at ${shopName}`
        : `Réservation confirmée chez ${shopName}`);

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {hasDeposit
          ? (isEn ? 'One last step ✨' : 'Une dernière étape ✨')
          : (isEn ? 'Booking confirmed ✨' : 'Réservation confirmée ✨')}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${clientFirstName}, here's the recap of your appointment at ${shopName}.`
          : `Bonjour ${clientFirstName}, voici le récapitulatif de votre rendez-vous chez ${shopName}.`}
      </Text>

      <Section style={summaryBox}>
        <Text style={summaryRow}>
          <strong style={summaryLabel}>{isEn ? 'Date' : 'Date'}</strong>
          <span style={summaryValue}>{formattedDate}</span>
        </Text>
        <Text style={summaryRow}>
          <strong style={summaryLabel}>{isEn ? 'Time' : 'Heure'}</strong>
          <span style={summaryValue}>{time}</span>
        </Text>
        {isHomeService && (
          <Text style={summaryRow}>
            <strong style={summaryLabel}>{isEn ? 'Address' : 'Adresse'}</strong>
            <span style={summaryValue}>{customerAddress}</span>
          </Text>
        )}
        <Text style={summaryRow}>
          <strong style={summaryLabel}>{isEn ? 'Services' : 'Prestations'}</strong>
          <span style={summaryValue}>{services.map(s => s.name).join(', ')}</span>
        </Text>
        <Text style={summaryRow}>
          <strong style={summaryLabel}>{isEn ? 'Duration' : 'Durée'}</strong>
          <span style={summaryValue}>{formatDurationEmail(totalDuration)}</span>
        </Text>
        <Hr style={summaryDivider} />
        <Text style={summaryRow}>
          <strong style={summaryLabelTotal}>{isEn ? 'Total' : 'Total'}</strong>
          <span style={summaryValueTotal}>{formatPriceEmail(totalPrice, currency, isEn)}</span>
        </Text>
      </Section>

      {hasDeposit && deposit && (
        <Section style={depositBox}>
          <Text style={depositTitle}>
            {isEn ? 'Deposit required to confirm' : 'Acompte à régler pour confirmer'}
          </Text>
          {deposit.amount != null && (
            <Text style={depositAmount}>
              {formatPriceEmail(deposit.amount, currency, isEn)}
              {deposit.percent ? ` (${deposit.percent}%)` : ''}
            </Text>
          )}
          {deposit.deadlineHours && (
            <Text style={depositDeadline}>
              {isEn
                ? `Please pay within ${deposit.deadlineHours}h, otherwise the slot will be released.`
                : `À régler sous ${deposit.deadlineHours}h, sinon le créneau sera libéré.`}
            </Text>
          )}
          {deposit.links.map((link, i) => (
            <Section key={i} style={depositButtonContainer}>
              <Button style={primaryButton} href={link.url}>
                {link.label || (isEn ? 'Pay deposit' : 'Régler l\'acompte')}
              </Button>
            </Section>
          ))}
        </Section>
      )}

      {!hasDeposit && (
        <Text style={paragraph}>
          {isEn
            ? `${shopName} can't wait to welcome you. We'll send you a reminder the day before.`
            : `${shopName} a hâte de vous accueillir. Vous recevrez un rappel la veille.`}
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button style={secondaryButton} href={loyaltyCardUrl}>
          {isEn ? 'View my loyalty card' : 'Voir ma carte de fidélité'}
        </Button>
      </Section>

      {(cancelPolicyDays || reschedulePolicyDays) && (
        <Text style={policyText}>
          {cancelPolicyDays && (
            isEn
              ? `Cancellation possible up to ${cancelPolicyDays} day${cancelPolicyDays > 1 ? 's' : ''} before the appointment.`
              : `Annulation possible jusqu'à ${cancelPolicyDays} jour${cancelPolicyDays > 1 ? 's' : ''} avant le rendez-vous.`
          )}
          {cancelPolicyDays && reschedulePolicyDays ? ' ' : ''}
          {reschedulePolicyDays && (
            isEn
              ? `Reschedule possible up to ${reschedulePolicyDays} day${reschedulePolicyDays > 1 ? 's' : ''} before.`
              : `Report possible jusqu'à ${reschedulePolicyDays} jour${reschedulePolicyDays > 1 ? 's' : ''} avant.`
          )}
        </Text>
      )}

      <EmailSignoff prefix={isEn ? 'See you soon,' : 'À bientôt,'}>
        {shopName}
      </EmailSignoff>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '26px',
  fontWeight: '700',
  lineHeight: '1.25',
  margin: '0 0 16px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const summaryBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '14px',
  padding: '20px 22px',
  margin: '24px 0',
  border: '1px solid #E5E7EB',
};

const summaryRow = {
  display: 'block',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
};

const summaryLabel = {
  color: '#6B7280',
  fontWeight: '500',
  display: 'inline-block',
  width: '110px',
  fontSize: '13px',
};

const summaryValue = {
  color: '#111827',
  fontWeight: '600',
  fontSize: '14px',
};

const summaryDivider = {
  borderColor: '#E5E7EB',
  margin: '14px 0 12px 0',
};

const summaryLabelTotal = {
  color: '#374151',
  fontWeight: '700',
  display: 'inline-block',
  width: '110px',
  fontSize: '14px',
};

const summaryValueTotal = {
  color: '#111827',
  fontWeight: '800',
  fontSize: '17px',
};

const depositBox = {
  backgroundColor: '#FEF7F0',
  borderRadius: '14px',
  padding: '22px',
  margin: '24px 0 20px 0',
  border: '1px solid #FDE4CC',
  textAlign: 'center' as const,
};

const depositTitle = {
  color: '#9A3412',
  fontSize: '13px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
  margin: '0 0 6px 0',
};

const depositAmount = {
  color: '#7C2D12',
  fontSize: '28px',
  fontWeight: '800',
  lineHeight: '1.1',
  margin: '0 0 8px 0',
};

const depositDeadline = {
  color: '#9A3412',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0 0 16px 0',
};

const depositButtonContainer = {
  textAlign: 'center' as const,
  margin: '8px 0 0 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const primaryButton = {
  backgroundColor: '#4b0082',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '13px 28px',
  display: 'inline-block',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #4b0082',
  borderRadius: '10px',
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '11px 22px',
  display: 'inline-block',
};

const policyText = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  margin: '16px 0 8px 0',
};

export default BookingConfirmationEmail;
