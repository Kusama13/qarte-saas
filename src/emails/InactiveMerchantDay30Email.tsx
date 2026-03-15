import {
  Heading,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface InactiveMerchantDay30EmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function InactiveMerchantDay30Email({ shopName, locale = 'fr' }: InactiveMerchantDay30EmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('inactiveDay30.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('inactiveDay30.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('inactiveDay30.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('inactiveDay30.intro')}
      </Text>

      <Text style={paragraph}>
        {t('inactiveDay30.questionText')}
      </Text>

      <Text style={paragraph}>
        {t('inactiveDay30.option1')}
      </Text>
      <Text style={paragraph}>
        {t('inactiveDay30.option2')}
      </Text>
      <Text style={paragraph}>
        {t('inactiveDay30.option3')}
      </Text>

      <Text style={paragraph}>
        {t('inactiveDay30.helpText')}
      </Text>

      <Text style={signatureBlock}>
        {t('inactiveDay30.signature')}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '22px',
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

const signatureBlock = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '32px 0 0 0',
  fontWeight: '500',
};

export default InactiveMerchantDay30Email;
