import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface Day5CheckinEmailProps {
  shopName: string;
  totalScans: number;
  referralCode?: string;
}

export function Day5CheckinEmail({ shopName, totalScans, referralCode }: Day5CheckinEmailProps) {
  const hasScans = totalScans > 0;

  return (
    <BaseLayout preview={`${shopName}, comment se passe votre 1ère semaine ?`}>
      <Heading style={heading}>
        Comment se passe votre premi&egrave;re semaine ?
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      {hasScans ? (
        <>
          <Text style={paragraph}>
            Vous avez d&eacute;j&agrave; <strong>{totalScans} scan{totalScans > 1 ? 's' : ''}</strong> cette
            semaine, bravo ! Continuez comme &ccedil;a, les r&eacute;sultats suivent.
          </Text>

          <Section style={successBox}>
            <Text style={successTitle}>Prochaine &eacute;tape</Text>
            <Text style={successText}>
              Partagez votre programme sur vos r&eacute;seaux sociaux pour toucher
              encore plus de clients. Votre kit est pr&ecirc;t dans votre espace.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard/qr-download?tab=social">
              T&eacute;l&eacute;charger mon kit r&eacute;seaux sociaux
            </Button>
          </Section>
        </>
      ) : (
        <>
          <Text style={paragraph}>
            Votre programme est configur&eacute; et votre QR code est pr&ecirc;t.
            Il ne manque plus que vos clients !
          </Text>

          <Section style={actionBox}>
            <Text style={actionTitle}>3 actions pour d&eacute;marrer aujourd&apos;hui :</Text>
            <Text style={actionItem}>
              <strong>1.</strong> Imprimez votre QR code et placez-le pr&egrave;s de la caisse
            </Text>
            <Text style={actionItem}>
              <strong>2.</strong> Proposez le scan &agrave; vos 5 prochains clients
            </Text>
            <Text style={actionItem}>
              <strong>3.</strong> Partagez sur Instagram / Facebook
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://getqarte.com/dashboard/qr-download">
              Acc&eacute;der &agrave; mon QR code
            </Button>
          </Section>
        </>
      )}

      <Text style={paragraph}>
        Besoin d&apos;aide ou de conseils ? On est l&agrave; :
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20mon%20programme%20Qarte">
          &Eacute;crire sur WhatsApp
        </Button>
      </Section>

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
        À très vite,
        <br />
        L&apos;équipe Qarte
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

const successBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #22c55e',
};

const successTitle = {
  color: '#166534',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const successText = {
  color: '#15803d',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const actionBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const actionTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const actionItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0 0 4px 0',
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

const whatsappButton = {
  backgroundColor: '#25D366',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
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

export default Day5CheckinEmail;
