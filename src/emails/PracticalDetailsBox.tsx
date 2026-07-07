import { Section, Text } from '@react-email/components';
import * as React from 'react';
import type { EmailLocale } from './translations';

interface PracticalDetailsBoxProps {
  /** Infos pratiques du merchant (adresse, accès, consignes...). */
  details: string;
  locale?: EmailLocale;
}

/**
 * Encart « À savoir avant votre venue » : infos pratiques libres du merchant.
 * Partagé entre l'email de confirmation et le rappel de la veille (source unique).
 */
export function PracticalDetailsBox({ details, locale = 'fr' }: PracticalDetailsBoxProps) {
  const isEn = locale === 'en';
  return (
    <Section style={box}>
      <Text style={title}>
        {isEn ? 'Good to know before you come' : 'À savoir avant votre venue'}
      </Text>
      <Text style={text}>{details}</Text>
    </Section>
  );
}

const box = {
  backgroundColor: '#F5F3FF',
  borderRadius: '14px',
  padding: '20px 22px',
  margin: '0 0 20px 0',
  border: '1px solid #DDD6FE',
};

const title = {
  color: '#5B21B6',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
  margin: '0 0 8px 0',
};

const text = {
  color: '#4C1D95',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-line' as const,
  // Free text : casse les URLs/codes longs pour ne pas déborder de l'encart.
  overflowWrap: 'break-word' as const,
  wordBreak: 'break-word' as const,
};

export default PracticalDetailsBox;
