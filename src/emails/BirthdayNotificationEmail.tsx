import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface BirthdayNotificationEmailProps {
  shopName: string;
  clientNames: string[];
  giftDescription: string;
}

export function BirthdayNotificationEmail({ shopName, clientNames, giftDescription }: BirthdayNotificationEmailProps) {
  const plural = clientNames.length > 1;
  const clientList = clientNames.length === 1
    ? clientNames[0]
    : clientNames.slice(0, -1).join(', ') + ' et ' + clientNames[clientNames.length - 1];

  return (
    <BaseLayout preview={`${clientList} ${plural ? 'fêtent leur' : 'fête son'} anniversaire aujourd'hui`}>
      <Heading style={heading}>
        Anniversaire client{plural ? 's' : ''} aujourd&apos;hui
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong>{clientList}</strong> {plural ? 'f&ecirc;tent leur' : 'f&ecirc;te son'} anniversaire <strong>aujourd&apos;hui</strong>.
      </Text>

      <Section style={giftBox}>
        <Text style={giftEmoji}>&#127873;</Text>
        <Text style={giftLabel}>Cadeau attribu&eacute; automatiquement</Text>
        <Text style={giftText}>{giftDescription}</Text>
      </Section>

      <Text style={paragraph}>
        Pensez &agrave; {plural ? 'leur' : 'lui'} envoyer un petit message personnel pour marquer le coup !
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/customers">
          Voir mes clients
        </Button>
      </Section>

      <Text style={signature}>
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

const giftBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #fde68a',
};

const giftEmoji = {
  fontSize: '40px',
  margin: '0 0 8px 0',
};

const giftLabel = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
};

const giftText = {
  color: '#78350f',
  fontSize: '18px',
  fontWeight: '700',
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

export default BirthdayNotificationEmail;
