import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ChallengeCompletedEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function ChallengeCompletedEmail({ shopName, locale = 'fr' }: ChallengeCompletedEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('challengeCompleted.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('challengeCompleted.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('challengeCompleted.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('challengeCompleted.intro')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('challengeCompleted.ctaDashboard')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Section style={recapBox}>
        <Text style={recapTitle}>{t('challengeCompleted.recapTitle')}</Text>
        <Text style={recapItem}>{t('challengeCompleted.recapItem1')}</Text>
        <Text style={recapItem}>{t('challengeCompleted.recapItem2')}</Text>
        <Text style={recapItem}>{t('challengeCompleted.recapItem3')}</Text>
      </Section>

      <Text style={paragraph}>
        {t('challengeCompleted.keepMomentum')}
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText} dangerouslySetInnerHTML={{ __html: t('challengeCompleted.urgencyText') }} />
      </Section>

      <Text style={paragraph}>
        {t('challengeCompleted.helpLine')}
      </Text>

      <Text style={signature}>
        {t('challengeCompleted.signature')}
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

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const recapBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const recapTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const recapItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
  paddingLeft: '16px',
};

const urgencyBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
  border: '1px solid #fde68a',
};

const urgencyText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default ChallengeCompletedEmail;
