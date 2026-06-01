import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { EmailSignoff } from './EmailSignoff';
import { getEmailT, type EmailLocale } from './translations';

interface ContestWinnerEmailProps {
  shopName: string;
  winnerName: string;
  prize: string;
  participantsCount: number;
  locale?: EmailLocale;
}

/** Tirage au sort mensuel terminé : annonce du gagnant au merchant. Ton festif. */
export function ContestWinnerEmail({
  shopName,
  winnerName,
  prize,
  participantsCount,
  locale = 'fr',
}: ContestWinnerEmailProps) {
  const t = getEmailT(locale);

  return (
    <BaseLayout preview={t('contestWinner.preview', { winnerName })} locale={locale}>
      <Heading style={heading}>{t('contestWinner.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('contestWinner.greeting', { shopName }) }} />

      <Text style={paragraph}>{t('contestWinner.intro')}</Text>

      <Section style={winnerBox}>
        <Text style={winnerLabel}>{t('contestWinner.winnerLabel')}</Text>
        <Text style={winnerNameStyle}>{winnerName}</Text>
        <Hr style={winnerDivider} />
        <Text style={prizeLabel}>{t('contestWinner.prizeLabel')}</Text>
        <Text style={prizeStyle}>{prize}</Text>
        <Text style={participantsStyle}>
          {t('contestWinner.participants', {
            count: String(participantsCount),
            plural: participantsCount > 1 ? 's' : '',
          })}
        </Text>
      </Section>

      <Text style={paragraph}>{t('contestWinner.next')}</Text>

      <Section style={buttonContainer}>
        <Button style={ctaButton} href="https://getqarte.com/dashboard/contest">
          {t('contestWinner.cta')}
        </Button>
      </Section>

      <Text style={helpText}>{t('contestWinner.helpText')}</Text>

      <EmailSignoff>{t('contestWinner.signature')}</EmailSignoff>
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

const winnerBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '28px 24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const winnerLabel = {
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 8px 0',
};

const winnerNameStyle = {
  color: '#4b0082',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0',
};

const winnerDivider = {
  borderColor: '#d6c9f5',
  margin: '20px auto',
  width: '60px',
};

const prizeLabel = {
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 6px 0',
};

const prizeStyle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '0 0 16px 0',
};

const participantsStyle = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
};

const ctaButton = {
  backgroundColor: '#4b0082',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const helpText = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

export default ContestWinnerEmail;
