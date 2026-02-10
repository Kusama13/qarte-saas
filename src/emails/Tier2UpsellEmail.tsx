import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface Tier2UpsellEmailProps {
  shopName: string;
  totalCustomers: number;
  rewardDescription: string;
  referralCode?: string;
}

export function Tier2UpsellEmail({ shopName, totalCustomers, rewardDescription, referralCode }: Tier2UpsellEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, vos meilleurs clients méritent plus`}>
      <Heading style={heading}>
        Vos meilleurs clients m&eacute;ritent un traitement VIP
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Vous avez d&eacute;j&agrave; <strong>{totalCustomers} client{totalCustomers > 1 ? 's' : ''}</strong> dans
        votre programme. C&apos;est le moment id&eacute;al pour r&eacute;compenser vos plus fid&egrave;les.
      </Text>

      <Section style={vipBox}>
        <Text style={vipTitle}>Programme VIP &mdash; Palier 2</Text>
        <Text style={vipText}>
          Ajoutez un 2&egrave;me niveau de r&eacute;compense pour vos clients les plus assidus.
          Plus ils viennent, plus la r&eacute;compense est grande.
        </Text>
      </Section>

      <Section style={exampleBox}>
        <Text style={exampleTitle}>Exemple pour votre commerce :</Text>
        <Text style={exampleItem}>
          <strong>Palier 1 :</strong> {rewardDescription} (actuel)
        </Text>
        <Text style={exampleItem}>
          <strong>Palier 2 :</strong> Une r&eacute;compense premium apr&egrave;s 20 passages
        </Text>
        <Text style={exampleNote}>
          Vous choisissez la r&eacute;compense et le nombre de passages requis.
        </Text>
      </Section>

      <Section style={benefitBox}>
        <Text style={benefitTitle}>Pourquoi &ccedil;a marche</Text>
        <Text style={benefitItem}>&#8594; Les clients VIP d&eacute;pensent en moyenne <strong>2x plus</strong></Text>
        <Text style={benefitItem}>&#8594; &Ccedil;a cr&eacute;e un sentiment d&apos;exclusivit&eacute;</Text>
        <Text style={benefitItem}>&#8594; Vos meilleurs clients se sentent reconnus</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Activer le Palier VIP
        </Button>
      </Section>

      <Text style={noteText}>
        D&eacute;j&agrave; inclus dans votre abonnement, aucun co&ucirc;t suppl&eacute;mentaire.
      </Text>

      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitle}>&#127873; Gagnez 10&euro; de r&eacute;duction</Text>
          <Text style={referralText}>
            Vous connaissez un(e) commer&ccedil;ant(e) dans la beaut&eacute; ?
            Recommandez-lui Qarte et recevez chacun <strong>10&euro; de r&eacute;duction</strong> sur votre prochain mois.
          </Text>
          <Text style={referralCode_style}>Votre code : <strong>{referralCode}</strong></Text>
          <Text style={referralHint}>
            Votre filleul nous communique votre code apr&egrave;s son inscription et la r&eacute;duction est appliqu&eacute;e &agrave; chacun.
          </Text>
        </Section>
      )}

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

const vipBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #e9d5ff',
  textAlign: 'center' as const,
};

const vipTitle = {
  color: '#7c3aed',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const vipText = {
  color: '#6b21a8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const exampleBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const exampleTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const exampleItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 4px 0',
};

const exampleNote = {
  color: '#9ca3af',
  fontSize: '13px',
  fontStyle: 'italic' as const,
  margin: '8px 0 0 0',
};

const benefitBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const benefitTitle = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const benefitItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
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

const noteText = {
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

const referralBox = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e9d5ff',
};

const referralTitle = {
  color: '#4b0082',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const referralText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const referralCode_style = {
  color: '#4b0082',
  fontSize: '18px',
  fontWeight: '700',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
  padding: '8px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px dashed #c4b5fd',
};

const referralHint = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0',
};

export default Tier2UpsellEmail;
