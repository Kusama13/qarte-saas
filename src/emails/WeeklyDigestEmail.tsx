import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface WeeklyDigestEmailProps {
  shopName: string;
  scansThisWeek: number;
  newCustomers: number;
  rewardsEarned: number;
  totalCustomers: number;
}

export function WeeklyDigestEmail({
  shopName,
  scansThisWeek,
  newCustomers,
  rewardsEarned,
  totalCustomers,
}: WeeklyDigestEmailProps) {
  const hasActivity = scansThisWeek > 0 || newCustomers > 0;

  return (
    <BaseLayout preview={`${shopName} — votre semaine en un clin d'oeil`}>
      <Heading style={heading}>
        Votre semaine en un clin d&apos;oeil
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      {hasActivity ? (
        <>
          <Text style={paragraph}>
            Voici le r&eacute;sum&eacute; de votre activit&eacute; cette semaine :
          </Text>

          <Section style={statsGrid}>
            <Section style={statCard}>
              <Text style={statNumber}>{scansThisWeek}</Text>
              <Text style={statLabel}>scan{scansThisWeek > 1 ? 's' : ''}</Text>
            </Section>
            <Section style={statCard}>
              <Text style={statNumber}>{newCustomers}</Text>
              <Text style={statLabel}>nouveau{newCustomers > 1 ? 'x' : ''}</Text>
            </Section>
            <Section style={statCard}>
              <Text style={statNumber}>{rewardsEarned}</Text>
              <Text style={statLabel}>r&eacute;compense{rewardsEarned > 1 ? 's' : ''}</Text>
            </Section>
          </Section>

          <Section style={totalBox}>
            <Text style={totalText}>
              <strong>{totalCustomers}</strong> client{totalCustomers > 1 ? 's' : ''} fid&eacute;lis&eacute;{totalCustomers > 1 ? 's' : ''} au total
            </Text>
          </Section>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            Aucun scan cette semaine. Ce n&apos;est pas grave &mdash; il suffit d&apos;un rappel
            &agrave; vos clients pour relancer la machine.
          </Text>

          <Section style={tipBox}>
            <Text style={tipTitle}>Astuce de la semaine</Text>
            <Text style={tipText}>
              Dites &agrave; vos 5 prochains clients : &laquo; On a un programme de fid&eacute;lit&eacute;,
              scannez ce QR code pour cumuler des points ! &raquo;
            </Text>
          </Section>
        </>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Voir mon tableau de bord
        </Button>
      </Section>

      <Text style={signature}>
        Bonne semaine,
        <br />
        L&apos;&eacute;quipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const statsGrid = {
  margin: '24px 0',
  textAlign: 'center' as const,
};

const statCard = {
  display: 'inline-block' as const,
  width: '30%',
  textAlign: 'center' as const,
  padding: '16px 8px',
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  margin: '0 4px',
};

const statNumber = {
  color: '#4b0082',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '4px 0 0 0',
};

const totalBox = {
  textAlign: 'center' as const,
  padding: '12px 20px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '0 0 24px 0',
};

const totalText = {
  color: '#166534',
  fontSize: '15px',
  margin: '0',
};

const tipBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #f59e0b',
};

const tipTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const tipText = {
  color: '#78350f',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
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

export default WeeklyDigestEmail;
