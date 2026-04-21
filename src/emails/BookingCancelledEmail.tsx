import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface BookingCancelledEmailProps {
  shopName: string;
  clientName: string;
  date: string;
  time: string;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

export function BookingCancelledEmail({
  shopName,
  clientName,
  date,
  time,
  dashboardUrl = 'https://getqarte.com/dashboard/planning',
  locale = 'fr',
}: BookingCancelledEmailProps) {
  const isEn = locale === 'en';

  const preview = isEn
    ? `${clientName} cancelled their appointment`
    : `${clientName} a annulé son RDV`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'Appointment cancelled' : 'RDV annulé'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${shopName}, ${clientName} just cancelled their appointment from your online page.`
          : `Hello ${shopName}, ${clientName} vient d'annuler son RDV depuis ta vitrine en ligne.`}
      </Text>

      <Section style={cancelBox}>
        <Text style={cancelLabel}>{isEn ? 'Cancelled slot' : 'Créneau annulé'}</Text>
        <Text style={cancelValue}>
          {date} {isEn ? 'at' : 'à'} {time}
        </Text>
      </Section>

      <Text style={paragraph}>
        {isEn
          ? 'This slot is now available for other bookings.'
          : 'Le créneau est à nouveau disponible pour de nouvelles réservations.'}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          {isEn ? 'View in planning' : 'Voir dans le planning'}
        </Button>
      </Section>

      <Text style={signature}>
        {isEn ? 'The Qarte team' : "L'équipe Qarte"}
      </Text>
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

const cancelBox = {
  backgroundColor: '#FEF2F2',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #FECACA',
  textAlign: 'center' as const,
};

const cancelLabel = {
  color: '#991B1B',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 6px 0',
};

const cancelValue = {
  color: '#7F1D1D',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default BookingCancelledEmail;
