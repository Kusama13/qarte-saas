import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface QuickCheckEmailProps {
  shopName: string;
  daysRemaining: number;
  locale?: EmailLocale;
}

export function QuickCheckEmail({ shopName, daysRemaining, locale = 'fr' }: QuickCheckEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('quickCheck.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('quickCheck.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('quickCheck.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('quickCheck.intro')}
      </Text>

      <Text style={paragraph}>
        {t('quickCheck.question')}
      </Text>

      <Section style={optionsBox}>
        <Text style={optionItem}>{t('quickCheck.option1')}</Text>
        <Text style={optionItem}>{t('quickCheck.option2')}</Text>
        <Text style={optionItem}>{t('quickCheck.option3')}</Text>
        <Text style={optionItem}>{t('quickCheck.option4')}</Text>
      </Section>

      <Text style={paragraph}>
        {t('quickCheck.helpText')}
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText} dangerouslySetInnerHTML={{ __html: t('quickCheck.trialNote', { daysRemaining, daysPlural: daysRemaining > 1 ? 's' : '' }) }} />
      </Section>

      <Text style={signature}>
        {t('quickCheck.signature')}
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

const optionsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const optionItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default QuickCheckEmail;
