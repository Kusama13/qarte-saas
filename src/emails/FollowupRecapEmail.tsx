import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import type { EmailLocale } from './translations';

export interface FollowupRecapAppointment {
  date: string;
  time: string;
  services: string[];
}

interface FollowupRecapEmailProps {
  shopName: string;
  clientFirstName: string;
  appointments: FollowupRecapAppointment[];
  hasDeposit: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  loyaltyCardUrl: string;
  locale?: EmailLocale;
}

export function FollowupRecapEmail({
  shopName,
  clientFirstName,
  appointments,
  hasDeposit,
  canCancel,
  canReschedule,
  loyaltyCardUrl,
  locale = 'fr',
}: FollowupRecapEmailProps) {
  const isEn = locale === 'en';

  const preview = isEn
    ? `Your next appointments at ${shopName} are booked`
    : `Vos prochains rendez-vous chez ${shopName} sont réservés`;

  // Message de rappel : avec acompte → on annonce le rappel J-7 pour régler + confirmer.
  // Sans acompte → simple rappel avant le RDV.
  const reminderText = hasDeposit
    ? (isEn
        ? 'We will send you a reminder one week before each appointment to pay the deposit and confirm it.'
        : 'Nous vous enverrons un rappel une semaine avant chaque rendez-vous pour régler l’acompte et le confirmer.')
    : (isEn
        ? 'We will send you a reminder before each appointment.'
        : 'Nous vous enverrons un rappel avant chaque rendez-vous.');

  const editText = canCancel && canReschedule
    ? (isEn ? 'Need to change? You can reschedule or cancel anytime from your card.' : 'Besoin de changer ? Vous pouvez le reporter ou l’annuler à tout moment depuis votre carte.')
    : canReschedule
      ? (isEn ? 'Need to change? You can reschedule anytime from your card.' : 'Besoin de changer ? Vous pouvez le reporter à tout moment depuis votre carte.')
      : canCancel
        ? (isEn ? 'Need to change? You can cancel anytime from your card.' : 'Besoin de changer ? Vous pouvez l’annuler à tout moment depuis votre carte.')
        : null;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'Your next appointments are booked' : 'Vos prochains rendez-vous sont réservés'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${clientFirstName}, you've secured your next visits at ${shopName}. Nothing to pay right now.`
          : `Bonjour ${clientFirstName}, vous avez réservé vos prochaines visites chez ${shopName}. Rien à régler pour le moment.`}
      </Text>

      {appointments.map((appt, i) => (
        <Section key={i} style={apptBox}>
          <Text style={apptDate}>{appt.date} {isEn ? 'at' : 'à'} {appt.time}</Text>
          {appt.services.length > 0 && (
            <Text style={apptServices}>{appt.services.join(', ')}</Text>
          )}
        </Section>
      ))}

      <Text style={paragraph}>{reminderText}</Text>
      {editText && <Text style={paragraph}>{editText}</Text>}

      <Section style={buttonContainer}>
        <Button style={button} href={loyaltyCardUrl}>
          {isEn ? 'View my card' : 'Voir ma carte'}
        </Button>
      </Section>

      <EmailSignoff>{isEn ? `See you soon at ${shopName}` : `À très vite chez ${shopName}`}</EmailSignoff>
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

const apptBox = {
  backgroundColor: '#F5F3FF',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '12px 0',
  border: '1px solid #DDD6FE',
};

const apptDate = {
  color: '#4b0082',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0',
  textTransform: 'capitalize' as const,
};

const apptServices = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0 0 0',
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

export default FollowupRecapEmail;
