import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface ServiceDetail {
  name: string;
  price: number;
  duration: number;
}

interface BookingNotificationEmailProps {
  shopName: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  services: ServiceDetail[];
  totalDuration: number;
  totalPrice: number;
  deposit: { percent: number | null; amount: number | null } | null;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

function formatDurationEmail(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function BookingNotificationEmail({
  shopName,
  clientName,
  clientPhone,
  date,
  time,
  services,
  totalDuration,
  totalPrice,
  deposit,
  dashboardUrl = 'https://getqarte.com/dashboard/planning',
  locale = 'fr',
}: BookingNotificationEmailProps) {
  const isEn = locale === 'en';

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(
    isEn ? 'en-US' : 'fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  const preview = isEn
    ? `New booking from ${clientName}`
    : `Nouvelle réservation de ${clientName}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'New booking!' : 'Nouvelle réservation !'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${shopName}, ${clientName} just booked an appointment from your online page.`
          : `Hello ${shopName}, ${clientName} vient de réserver un créneau depuis ta vitrine en ligne.`}
      </Text>

      <Section style={bookingBox}>
        <Text style={bookingTitle}>
          {isEn ? 'Booking details' : 'Détails de la réservation'}
        </Text>
        <Text style={bookingDetail}>
          <strong>{isEn ? 'Date:' : 'Date :'}</strong> {formattedDate}
        </Text>
        <Text style={bookingDetail}>
          <strong>{isEn ? 'Time:' : 'Heure :'}</strong> {time}
        </Text>
        <Text style={bookingDetail}>
          <strong>{isEn ? 'Services:' : 'Prestations :'}</strong>{' '}
          {services.map(s => s.name).join(', ')}
        </Text>
        <Text style={bookingDetail}>
          <strong>{isEn ? 'Duration:' : 'Durée :'}</strong> {formatDurationEmail(totalDuration)}
        </Text>
        <Text style={bookingDetail}>
          <strong>{isEn ? 'Price:' : 'Prix :'}</strong> {totalPrice}€
        </Text>
        <Text style={bookingDetail}>
          <strong>{isEn ? 'Phone:' : 'Téléphone :'}</strong> {clientPhone}
        </Text>
      </Section>

      {deposit && deposit.amount && (
        <Section style={depositBox}>
          <Text style={depositText}>
            {isEn
              ? `Deposit requested: ${deposit.amount}€${deposit.percent ? ` (${deposit.percent}%)` : ''}`
              : `Acompte demandé : ${deposit.amount}€${deposit.percent ? ` (${deposit.percent}%)` : ''}`}
          </Text>
          <Text style={depositBalance}>
            {isEn
              ? `Remaining balance: ${totalPrice - deposit.amount}€`
              : `Solde restant dû : ${totalPrice - deposit.amount}€`}
          </Text>
        </Section>
      )}

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

const bookingBox = {
  backgroundColor: '#F0F4FF',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #C7D2FE',
};

const bookingTitle = {
  color: '#4338CA',
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px 0',
};

const bookingDetail = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 6px 0',
};

const depositBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '16px',
  margin: '0 0 24px 0',
  border: '1px solid #F59E0B',
  textAlign: 'center' as const,
};

const depositText = {
  color: '#92400E',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const depositBalance = {
  color: '#78350F',
  fontSize: '13px',
  fontWeight: '500',
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

export default BookingNotificationEmail;
