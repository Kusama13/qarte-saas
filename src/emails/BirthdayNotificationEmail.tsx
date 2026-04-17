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
  isSubscribed?: boolean;
  locale?: EmailLocale;
}

export function BirthdayNotificationEmail({ shopName, clientNames, giftDescription, isSubscribed = false, locale = 'fr' }: BirthdayNotificationEmailProps) {
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
        <Text style={giftLabel}>{t('birthdayNotification.giftLabel')}</Text>
        <Text style={giftText}>{giftDescription}</Text>
      </Section>

      <Text style={paragraph}>
        {t('birthdayNotification.reminderText')}
      </Text>

      {isSubscribed ? (
        <Section style={smsConfirmBox}>
          <Text style={smsConfirmTitle}>{t('birthdayNotification.smsConfirmTitle')}</Text>
          <Section style={smsPreviewBox}>
            <Text style={smsPreviewText}>
              {t('birthdayNotification.smsPreview', { shopName, giftDescription, clientName: clientNames[0] })}
            </Text>
          </Section>
          <Text style={smsConfirmNote}>{t('birthdayNotification.smsConfirmNote')}</Text>
        </Section>
      ) : (
        <Section style={smsUpsellBox}>
          <Text style={smsUpsellText}>
            {t('birthdayNotification.smsUpsell')}
          </Text>
        </Section>
      )}

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

const smsConfirmBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 16px 0',
  border: '1px solid #d1fae5',
};

const smsConfirmTitle = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0 0 10px 0',
};

const smsPreviewBox = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 10px 0',
  border: '1px solid #d1fae5',
};

const smsPreviewText = {
  color: '#374151',
  fontSize: '13px',
  fontStyle: 'italic' as const,
  lineHeight: '1.5',
  margin: '0',
};

const smsConfirmNote = {
  color: '#065f46',
  fontSize: '13px',
  margin: '0',
};

const smsUpsellBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 16px 0',
  border: '1px solid #e0d6fc',
};

const smsUpsellText = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '500' as const,
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
