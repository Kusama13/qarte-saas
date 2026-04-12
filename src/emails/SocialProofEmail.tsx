import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SocialProofEmailProps {
  shopName: string;
  locale?: EmailLocale;
}

export function SocialProofEmail({ shopName, locale = 'fr' }: SocialProofEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('socialProof.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('socialProof.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('socialProof.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('socialProof.intro')}
      </Text>

      {/* Case study */}
      <Section style={caseStudyBox}>
        <Text style={caseStudyBadge}>{t('socialProof.caseStudyBadge')}</Text>
        <Text style={caseStudyTitle} dangerouslySetInnerHTML={{ __html: t('socialProof.caseStudyTitle') }} />
        <Text style={caseStudyQuote}>
          {t('socialProof.caseStudyQuote')}
        </Text>
        <Text style={caseStudyAuthor}>{t('socialProof.caseStudyAuthor')}</Text>
      </Section>

      {/* Results */}
      <Section style={resultsBox}>
        <Text style={resultsTitle}>{t('socialProof.resultsTitle')}</Text>
        <Text style={resultItem}>{t('socialProof.result1')}</Text>
        <Text style={resultItem}>{t('socialProof.result2')}</Text>
        <Text style={resultItem}>{t('socialProof.result3')}</Text>
      </Section>

      {/* Testimonials */}
      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>{t('socialProof.testimonial1')}</Text>
        <Text style={testimonialAuthor}>{t('socialProof.testimonial1Author')}</Text>
      </Section>

      <Section style={testimonialBox}>
        <Text style={testimonialQuote}>{t('socialProof.testimonial2')}</Text>
        <Text style={testimonialAuthor}>{t('socialProof.testimonial2Author')}</Text>
      </Section>

      <Text style={paragraph}>
        {t('socialProof.closing')}
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          {t('socialProof.cta')}
        </Button>
      </Section>

      <Text style={signature}>
        {t('socialProof.signature')}
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

const caseStudyBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e0d6fc',
};

const caseStudyBadge = {
  color: '#6d28d9',
  fontSize: '11px',
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  margin: '0 0 8px 0',
};

const caseStudyTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 12px 0',
};

const caseStudyQuote = {
  color: '#4a5568',
  fontSize: '15px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const caseStudyAuthor = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const resultsBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
  border: '1px solid #d1fae5',
};

const resultsTitle = {
  color: '#065f46',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 10px 0',
};

const resultItem = {
  color: '#065f46',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const testimonialBox = {
  borderLeft: '3px solid #4b0082',
  paddingLeft: '20px',
  margin: '0 0 16px 0',
};

const testimonialQuote = {
  color: '#4a5568',
  fontSize: '15px',
  fontStyle: 'italic' as const,
  lineHeight: '1.6',
  margin: '0 0 4px 0',
};

const testimonialAuthor = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
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

export default SocialProofEmail;
