import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface PlanningReminderEmailProps {
  shopName: string;
  daysRemaining: number;
  locale?: EmailLocale;
}

export function PlanningReminderEmail({ shopName, daysRemaining, locale = 'fr' }: PlanningReminderEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('planningReminder.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('planningReminder.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('planningReminder.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('planningReminder.intro')}
      </Text>

      <Section style={featureBox}>
        <Text style={featureTitle}>{t('planningReminder.featureTitle')}</Text>
        <Text style={featureDesc}>{t('planningReminder.featureDesc')}</Text>
      </Section>

      <Section style={bonusBox}>
        <Text style={featureTitle}>{t('planningReminder.bonusTitle')}</Text>
        <Text style={featureDesc} dangerouslySetInnerHTML={{ __html: t('planningReminder.bonusDesc') }} />
      </Section>

      <Section style={urgencyBox}>
        <Text style={urgencyText} dangerouslySetInnerHTML={{ __html: t('planningReminder.trialNote', { daysRemaining, daysPlural: daysRemaining > 1 ? 's' : '' }) }} />
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/planning">
          {t('planningReminder.cta')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('planningReminder.signature')}
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

const featureBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 16px 0',
  border: '1px solid #d1fae5',
};

const featureTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const featureDesc = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const bonusBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 16px 0',
  border: '1px solid #e0d6fc',
};

const urgencyBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const urgencyText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0 0 0',
};

const button = {
  backgroundColor: '#059669',
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

export default PlanningReminderEmail;
