import {
  Button,
  Heading,
  Text,
  Section,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface EbookEmailProps {
  downloadUrl?: string;
  shopName?: string;
}

export function EbookEmail({ downloadUrl = 'https://getqarte.com/ebooks/guide-fidelisation.pdf', shopName }: EbookEmailProps) {
  return (
    <BaseLayout preview="Votre guide de fidélisation est prêt">
      <Heading style={heading}>
        Votre guide est prêt
      </Heading>

      <Text style={paragraph}>
        {shopName ? `Bonjour ${shopName},` : 'Bonjour,'}
      </Text>

      <Text style={paragraph}>
        Merci pour votre intérêt ! Voici votre guide :{' '}
        <strong>&quot;Comment fidéliser vos clients et augmenter votre chiffre d&apos;affaires&quot;</strong>
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={downloadUrl}>
          Télécharger le guide PDF
        </Button>
      </Section>

      <Section style={contentBox}>
        <Text style={contentTitle}>Dans ce guide, vous découvrirez :</Text>
        <Text style={contentItem}>- La règle des 20% qui génère 80% de vos revenus</Text>
        <Text style={contentItem}>- L&apos;architecture de la récompense psychologique</Text>
        <Text style={contentItem}>- Le calcul du LTV (Life Time Value) prédictif</Text>
        <Text style={contentItem}>- 3 stratégies pour fidéliser sans réduire vos marges</Text>
      </Section>

      <Section style={ctaBox}>
        <Text style={ctaTitle}>Fidélisez vos clients dès aujourd&apos;hui</Text>
        <Text style={ctaText}>
          Les commerces qui fidélisent leurs clients voient leur chiffre d&apos;affaires augmenter de 35% en moyenne.
          Testez Qarte pendant 15 jours.
        </Text>
        <Button style={ctaButton} href="https://getqarte.com/auth/merchant">
          Découvrir Qarte
        </Button>
      </Section>

      <Text style={paragraph}>
        Des questions ? Répondez simplement à cet email.
      </Text>

      <Text style={signature}>
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
};

const contentBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const contentTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const contentItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const ctaBox = {
  backgroundColor: '#654EDA',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const ctaTitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const ctaText = {
  color: '#e0e0ff',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const ctaButton = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  color: '#654EDA',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default EbookEmail;
