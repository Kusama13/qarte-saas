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

interface PostSurveyFollowUpEmailProps {
  shopName: string;
  variant: string;
  daysRemaining: number;
  locale?: EmailLocale;
}

export function PostSurveyFollowUpEmail({ shopName, variant, daysRemaining, locale = 'fr' }: PostSurveyFollowUpEmailProps) {
  const t = getEmailT(locale);
  const vk = CONVINCE_VARIANT_KEYS[variant as keyof typeof CONVINCE_VARIANT_KEYS] || 'nothing';
  const ns = `postSurveyFollowUp.${vk}` as any;
  const isLastDay = daysRemaining <= 1;

  return (
    <BaseLayout preview={t(`${ns}.preview` as any, { shopName })} locale={locale}>
      <Heading style={heading}>
        {t(`${ns}.heading` as any)}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('postSurveyFollowUp.greeting' as any, { shopName }) }} />

      <Text style={paragraph}>
        {t(`${ns}.intro` as any)}
      </Text>

      {/* Promo box for lower_price */}
      {variant === 'lower_price' && (
        <Section style={promoBox}>
          <Text style={promoLabel}>{t(`${ns}.promoLabel` as any)}</Text>
          <Text style={promoCode}>{t(`${ns}.promoCode` as any)}</Text>
        </Section>
      )}

      {/* Body text */}
      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t(`${ns}.body` as any) }} />

      {/* Social proof if available */}
      {(variant === 'lower_price' || variant === 'nothing') && (
        <Section style={testimonialBox}>
          <Text style={testimonialText}>
            {t(`${ns}.socialProof` as any)}
          </Text>
        </Section>
      )}

      {isLastDay && (
        <Section style={urgentBox}>
          <Text style={urgentText}>{t('postSurveyFollowUp.lastDayWarning' as any)}</Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={`https://getqarte.com/${variant === 'lower_price' ? 'dashboard/subscription' : 'dashboard'}`}>
          {t(`${ns}.cta` as any)}
        </Button>
      </Section>

      {variant === 'team_demo' && (
        <Text style={helpLine}>
          {t(`${ns}.helpLine` as any)}
        </Text>
      )}

      <Text style={signature}>
        {t('postSurveyFollowUp.signaturePrefix' as any)}
        <br />
        {t('postSurveyFollowUp.signature' as any)}
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600' as const,
  lineHeight: '1.3',
  margin: '0 0 24px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
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

const testimonialBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const testimonialText = {
  color: '#4a5568',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0',
};

const urgentBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '2px solid #fecaca',
};

const urgentText = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: '600' as const,
  lineHeight: '1.5',
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
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const helpLine = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
  fontStyle: 'italic' as const,
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default PostSurveyFollowUpEmail;
