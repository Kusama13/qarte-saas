import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface BookingRescheduledEmailProps {
  shopName: string;
  clientName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  dashboardUrl?: string;
  locale?: EmailLocale;
}

export function BookingRescheduledEmail({
  shopName,
  clientName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  dashboardUrl = 'https://getqarte.com/dashboard/planning',
  locale = 'fr',
}: BookingRescheduledEmailProps) {
  const isEn = locale === 'en';

  const preview = isEn
    ? `${clientName} moved their appointment`
    : `${clientName} a déplacé son RDV`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Heading style={heading}>
        {isEn ? 'Appointment moved' : 'RDV déplacé'}
      </Heading>

      <Text style={paragraph}>
        {isEn
          ? `Hi ${shopName}, ${clientName} just rescheduled their appointment from your online page.`
          : `Hello ${shopName}, ${clientName} vient de déplacer son RDV depuis ta vitrine en ligne.`}
      </Text>

      <Section style={changeBox}>
        <Text style={changeLabel}>{isEn ? 'Before' : 'Avant'}</Text>
        <Text style={changeOld}>
          {oldDate} {isEn ? 'at' : 'à'} {oldTime}
        </Text>
        <Text style={changeLabel}>{isEn ? 'Now' : 'Maintenant'}</Text>
        <Text style={changeNew}>
          {newDate} {isEn ? 'at' : 'à'} {newTime}
        </Text>
      </Section>

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

const changeBox = {
  backgroundColor: '#F0F4FF',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #C7D2FE',
};

const changeLabel = {
  color: '#6B7280',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const changeOld = {
  color: '#9CA3AF',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'line-through',
  margin: '0 0 16px 0',
};

const changeNew = {
  color: '#4338CA',
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

export default BookingRescheduledEmail;
