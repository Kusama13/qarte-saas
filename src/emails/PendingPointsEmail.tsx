import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface PendingPointsEmailProps {
  shopName: string;
  pendingCount: number;
  dashboardUrl?: string;
  isReminder?: boolean;
  daysSinceFirst?: number;
}

export function PendingPointsEmail({
  shopName,
  pendingCount,
  dashboardUrl = 'https://getqarte.com/dashboard',
  isReminder = false,
  daysSinceFirst,
}: PendingPointsEmailProps) {
  const title = isReminder
    ? `Rappel : ${pendingCount} point${pendingCount > 1 ? 's' : ''} en attente`
    : `${pendingCount} point${pendingCount > 1 ? 's' : ''} en attente de validation`;

  return (
    <BaseLayout preview={title}>
      <Heading style={heading}>
        {isReminder ? '📋 Rappel de modération' : '🛡️ Qarte Shield - Alerte'}
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      {isReminder ? (
        <Text style={paragraph}>
          Vous avez toujours <strong>{pendingCount} point{pendingCount > 1 ? 's' : ''}</strong> en attente
          de validation depuis {daysSinceFirst} jour{daysSinceFirst && daysSinceFirst > 1 ? 's' : ''}.
        </Text>
      ) : (
        <Text style={paragraph}>
          Notre système a détecté <strong>{pendingCount} passage{pendingCount > 1 ? 's' : ''} inhabituel{pendingCount > 1 ? 's' : ''}</strong> nécessitant votre validation.
        </Text>
      )}

      <Section style={alertBox}>
        <Text style={alertText}>
          <strong style={{ fontSize: '24px' }}>{pendingCount}</strong>
          <br />
          point{pendingCount > 1 ? 's' : ''} en attente
        </Text>
      </Section>

      <Text style={paragraph}>
        Ces points ont été mis en quarantaine car ils correspondent à des passages multiples
        d&apos;un même client dans la journée. Validez-les si le client était bien présent,
        ou refusez-les si le client n&apos;était pas présent.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          Modérer les points
        </Button>
      </Section>

      <Section style={tipBox}>
        <Text style={tipTitle}>💡 Conseil</Text>
        <Text style={tipText}>
          Si vous reconnaissez le client, validez le point. En cas de doute
          ou de comportement suspect, refusez-le pour protéger votre programme.
        </Text>
      </Section>

      <Text style={signature}>
        L&apos;équipe Qarte
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

const alertBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #F59E0B',
};

const alertText = {
  color: '#92400E',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '1.4',
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

const tipBox = {
  backgroundColor: '#EEF2FF',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '24px 0',
};

const tipTitle = {
  color: '#4338CA',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const tipText = {
  color: '#4338CA',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default PendingPointsEmail;
