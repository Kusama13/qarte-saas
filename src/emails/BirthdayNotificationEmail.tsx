import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface BirthdayNotificationEmailProps {
  shopName: string;
  clientNames: string[];
  giftDescription: string;
  locale?: EmailLocale;
}

export function BirthdayNotificationEmail({ shopName, clientNames, giftDescription, locale = 'fr' }: BirthdayNotificationEmailProps) {
  const t = getEmailT(locale);
  const plural = clientNames.length > 1;
  const pluralSuffix = plural ? 's' : '';
  const clientList = clientNames.length === 1
    ? clientNames[0]
    : clientNames.slice(0, -1).join(', ') + ' et ' + clientNames[clientNames.length - 1];

  return (
    <BaseLayout preview={t('birthdayNotification.preview', { plural: pluralSuffix })} locale={locale}>
      <Heading style={heading}>
        {t('birthdayNotification.heading', { plural: pluralSuffix })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('birthdayNotification.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {plural
          ? t('birthdayNotification.introPlural', { count: String(clientNames.length) })
          : t('birthdayNotification.introSingle')
        }
        {' '}<strong>{clientList}</strong>
      </Text>

      <Section style={giftBox}>
        <Text style={giftLabel}>{t('birthdayNotification.giftLabel', { giftDescription })}</Text>
        <Text style={giftText}>{giftDescription}</Text>
      </Section>

      <Text style={paragraph}>
        {t('birthdayNotification.reminderText')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/customers">
          {t('birthdayNotification.ctaDashboard')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('birthdayNotification.signature')}
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
