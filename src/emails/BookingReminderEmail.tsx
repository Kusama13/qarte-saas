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
import { PracticalDetailsBox } from './PracticalDetailsBox';
import type { EmailLocale } from './translations';

interface BookingReminderEmailProps {
  shopName: string;
  clientFirstName: string;
  date: string;
  time: string;
  services: string[];
  /** Adresse du salon (où venir). Null en service à domicile (la cliente est chez elle). */
  salonAddress?: string | null;
  /** Infos pratiques du merchant (« venez les cheveux propres », parking...). Facultatif. */
  practicalDetails?: string | null;
  loyaltyCardUrl: string;
  cancelPolicyDays?: number | null;
  reschedulePolicyDays?: number | null;
  locale?: EmailLocale;
}

/**
 * Rappel envoyé la veille au matin (cron booking-reminder-email) : récap du RDV du
 * lendemain + infos pratiques du merchant + adresse. Objectif : réduire les no-shows
 * et permettre à la cliente d'arriver préparée. Frère jumeau (canal email) du SMS J-1.
 */
export function BookingReminderEmail({
  shopName,
  clientFirstName,
  date,
  time,
  services,
  salonAddress,
  practicalDetails,
  loyaltyCardUrl,
  cancelPolicyDays,
  reschedulePolicyDays,
  locale = 'fr',
}: BookingReminderEmailProps) {
  const isEn = locale === 'en';

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(
    isEn ? 'en-US' : 'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  const preview = isEn
    ? `Reminder: your appointment tomorrow at ${shopName}`
    : `Rappel : votre rendez-vous demain chez ${shopName}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>{isEn ? 'See you tomorrow ✨' : 'À demain ✨'}</Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${clientFirstName}, a quick reminder of your appointment tomorrow at ${shopName}.`
          : `Bonjour ${clientFirstName}, un petit rappel de votre rendez-vous demain chez ${shopName}.`}
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
        {services.length > 0 && (
          <Text style={summaryRow}>
            <strong style={summaryLabel}>{isEn ? 'Services' : 'Prestations'}</strong>
            <span style={summaryValue}>{services.join(', ')}</span>
          </Text>
        )}
        {salonAddress && (
          <Text style={summaryRow}>
            <strong style={summaryLabel}>{isEn ? 'Address' : 'Adresse'}</strong>
            <span style={summaryValue}>{salonAddress}</span>
          </Text>
        )}
      </Section>

      {practicalDetails && (
        <PracticalDetailsBox details={practicalDetails} locale={locale} />
      )}

      <Section style={buttonContainer}>
        <Button style={secondaryButton} href={loyaltyCardUrl}>
          {isEn ? 'View my loyalty card' : 'Voir ma carte de fidélité'}
        </Button>
      </Section>

      {(cancelPolicyDays || reschedulePolicyDays) && (
        <>
          <Hr style={divider} />
          <Text style={policyText}>
            {cancelPolicyDays && (
              isEn
                ? `Need to cancel? Possible up to ${cancelPolicyDays} day${cancelPolicyDays > 1 ? 's' : ''} before from your loyalty card.`
                : `Un empêchement ? Annulation possible jusqu'à ${cancelPolicyDays} jour${cancelPolicyDays > 1 ? 's' : ''} avant depuis votre carte de fidélité.`
            )}
            {cancelPolicyDays && reschedulePolicyDays ? ' ' : ''}
            {reschedulePolicyDays && (
              isEn
                ? `Reschedule possible up to ${reschedulePolicyDays} day${reschedulePolicyDays > 1 ? 's' : ''} before.`
                : `Report possible jusqu'à ${reschedulePolicyDays} jour${reschedulePolicyDays > 1 ? 's' : ''} avant.`
            )}
          </Text>
        </>
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
  overflowWrap: 'break-word' as const,
  wordBreak: 'break-word' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
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

const divider = {
  borderColor: '#E5E7EB',
  margin: '24px 0 16px 0',
};

const policyText = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
};

export default BookingReminderEmail;
