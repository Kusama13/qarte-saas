import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface FirstRewardEmailProps {
  shopName: string;
  rewardDescription: string;
}

export function FirstRewardEmail({ shopName, rewardDescription }: FirstRewardEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, un client a gagné sa récompense !`}>
      <Heading style={heading}>
        Premi&egrave;re r&eacute;compense d&eacute;bloqu&eacute;e !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Un de vos clients vient d&apos;atteindre le nombre de passages requis
        et a d&eacute;bloqu&eacute; sa r&eacute;compense. C&apos;est la preuve que votre programme fonctionne !
      </Text>

      <Section style={rewardBox}>
        <Text style={rewardEmoji}>&#127942;</Text>
        <Text style={rewardLabel}>R&eacute;compense gagn&eacute;e</Text>
        <Text style={rewardText}>{rewardDescription}</Text>
      </Section>

      <Text style={paragraph}>
        Ce client reviendra pour utiliser sa r&eacute;compense &mdash; et recommencera
        &agrave; cumuler des points. C&apos;est le cercle vertueux de la fid&eacute;lit&eacute;.
      </Text>

      <Section style={statsBox}>
        <Text style={statsTitle}>Le saviez-vous ?</Text>
        <Text style={statsText}>
          Les clients qui atteignent une r&eacute;compense ont <strong>3x plus de chances</strong> de
          revenir r&eacute;guli&egrave;rement dans votre commerce.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Voir mon tableau de bord
        </Button>
      </Section>

      <Text style={signature}>
        L&apos;&eacute;quipe Qarte
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

const rewardBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #fde68a',
};

const rewardEmoji = {
  fontSize: '40px',
  margin: '0 0 8px 0',
};

const rewardLabel = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
};

const rewardText = {
  color: '#78350f',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
};

const statsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const statsTitle = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const statsText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
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

export default FirstRewardEmail;
