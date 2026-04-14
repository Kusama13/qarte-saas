import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';
import { CONVINCE_VARIANT_KEYS } from '@/lib/churn-survey-config';

interface PostSurveyLastChanceEmailProps {
  shopName: string;
  variant: string;
  locale?: EmailLocale;
}

export function PostSurveyLastChanceEmail({ shopName, variant, locale = 'fr' }: PostSurveyLastChanceEmailProps) {
  const t = getEmailT(locale);
  const vk = CONVINCE_VARIANT_KEYS[variant as keyof typeof CONVINCE_VARIANT_KEYS] || 'nothing';
  const ns = `postSurveyLastChance.${vk}` as any;

  return (
    <BaseLayout preview={t(`${ns}.preview` as any, { shopName })} locale={locale}>
      <Heading style={headingUrgent}>
        {t(`${ns}.heading` as any)}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('postSurveyLastChance.greeting' as any, { shopName }) }} />

      <Text style={paragraph}>
        {t(`${ns}.intro` as any)}
      </Text>

      <Section style={urgentBox}>
        <Text style={urgentText}>{t('postSurveyLastChance.urgentText' as any)}</Text>
      </Section>

      {/* Promo box for lower_price */}
      {variant === 'lower_price' && (
        <Section style={promoBox}>
          <Text style={promoLabel}>{t(`${ns}.promoLabel` as any)}</Text>
          <Text style={promoCode}>{t(`${ns}.promoCode` as any)}</Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={buttonUrgent} href="https://getqarte.com/dashboard/subscription">
          {t(`${ns}.cta` as any)}
        </Button>
      </Section>

      <Text style={reassurance}>
        {t('postSurveyLastChance.reassurance' as any)}
      </Text>

      <Text style={signature}>
        {t('postSurveyLastChance.signature' as any)}
      </Text>
    </BaseLayout>
  );
}

const headingUrgent = {
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: '700' as const,
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '2px solid #fecaca',
};

const urgentText = {
  color: '#991b1b',
  fontSize: '15px',
  fontWeight: '600' as const,
  lineHeight: '1.6',
  margin: '0',
};

const promoBox = {
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const promoLabel = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0 0 8px 0',
  opacity: 0.9,
};

const promoCode = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700' as const,
  letterSpacing: '2px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const buttonUrgent = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const reassurance = {
  color: '#9ca3af',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default PostSurveyLastChanceEmail;
