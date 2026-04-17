import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface SlotReleasedEmailProps {
  shopName: string;
  clientName: string;
  date: string;
  time: string;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

export function SlotReleasedEmail({
  shopName,
  clientName,
  date,
  time,
  dashboardUrl = 'https://getqarte.com/dashboard/planning?tab=reservations',
  locale = 'fr',
}: SlotReleasedEmailProps) {
  const isEn = locale === 'en';

  const preview = isEn
    ? `Slot released — ${clientName}`
    : `Créneau libéré — ${clientName}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'Slot released' : 'Créneau libéré'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${shopName}, the deposit for ${clientName} was not received in time. The slot has been automatically released so another client can book it.`
          : `Bonjour ${shopName}, l'acompte de ${clientName} n'a pas été reçu à temps. Le créneau a été automatiquement libéré pour qu'une autre cliente puisse le réserver.`}
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>
          {isEn ? 'Released slot' : 'Créneau libéré'}
        </Text>
        <Text style={detailLine}>
          <strong>{isEn ? 'Client:' : 'Cliente :'}</strong> {clientName}
        </Text>
        <Text style={detailLine}>
          <strong>{isEn ? 'Date:' : 'Date :'}</strong> {date}
        </Text>
        <Text style={detailLine}>
          <strong>{isEn ? 'Time:' : 'Heure :'}</strong> {time}
        </Text>
      </Section>

      <Text style={paragraph}>
        {isEn
          ? 'Need to rebook her? You can bring this reservation back from the Reservations tab — either on the original slot if it is still free, or on a new one. A confirmation SMS can be sent in the same flow.'
          : 'Tu veux la ramener ? Tu peux récupérer cette réservation depuis l\'onglet Réservations — soit sur le créneau d\'origine s\'il est encore libre, soit sur un nouveau créneau. Un SMS de confirmation peut être envoyé dans la foulée.'}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          {isEn ? 'Manage failed deposits' : 'Gérer les acomptes échoués'}
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

const detailBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #F59E0B',
};

const detailTitle = {
  color: '#92400E',
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px 0',
};

const detailLine = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 6px 0',
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

export default SlotReleasedEmail;
