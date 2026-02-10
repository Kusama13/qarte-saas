import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface FirstScanEmailProps {
  shopName: string;
  referralCode?: string;
}

export function FirstScanEmail({ shopName, referralCode }: FirstScanEmailProps) {

  return (
    <BaseLayout preview={`${shopName}, votre 1er client a scanné !`}>
      <Heading style={heading}>
        Votre programme est lanc&eacute; !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre premier client vient de scanner votre QR code.
        C&apos;est le d&eacute;but de votre programme de fid&eacute;lit&eacute; !
      </Text>

      <Section style={celebrationBox}>
        <Text style={celebrationEmoji}>&#127881;</Text>
        <Text style={celebrationTitle}>Premier scan valid&eacute;</Text>
        <Text style={celebrationText}>
          Chaque scan, c&apos;est un client qui s&apos;engage avec votre commerce.
          Les r&eacute;sultats arrivent vite.
        </Text>
      </Section>

      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitle}>&#127873; Gagnez 10&euro; de r&eacute;duction</Text>
          <Text style={referralText}>
            Vous connaissez un(e) coiffeur, barbier, esth&eacute;ticien(ne), g&eacute;rant(e) d&apos;institut de beaut&eacute;, d&apos;onglerie ou de spa ?
            Recommandez-lui Qarte et recevez chacun <strong>10&euro; de r&eacute;duction</strong> sur votre prochain mois.
          </Text>
          <Text style={referralCode_style}>Votre code : <strong>{referralCode}</strong></Text>
          <Text style={referralHint}>
            Votre filleul nous communique votre code apr&egrave;s son inscription sur Qarte et nous appliquons la r&eacute;duction &agrave; chacun de vous.
          </Text>
        </Section>
      )}

      <Section style={tipsBox}>
        <Text style={tipsTitle}>Pour acc&eacute;l&eacute;rer :</Text>
        <Text style={tipItem}>&#8594; Proposez le scan &agrave; chaque client aujourd&apos;hui</Text>
        <Text style={tipItem}>&#8594; Placez le QR code &agrave; hauteur des yeux pr&egrave;s de la caisse</Text>
        <Text style={tipItem}>&#8594; Dites simplement : &laquo; On a une carte de fid&eacute;lit&eacute; digitale, scannez ce QR code ! &raquo;</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Voir mes statistiques
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

const celebrationBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #bbf7d0',
};

const celebrationEmoji = {
  fontSize: '40px',
  margin: '0 0 8px 0',
};

const celebrationTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const celebrationText = {
  color: '#15803d',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const tipsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const tipsTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const tipItem = {
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

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default FirstScanEmail;
