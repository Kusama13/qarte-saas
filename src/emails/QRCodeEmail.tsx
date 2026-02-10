import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface QRCodeEmailProps {
  businessName?: string;
}

export function QRCodeEmail({ businessName }: QRCodeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

  return (
    <BaseLayout preview={`${businessName || 'Votre commerce'}, votre QR code fidélité est prêt !`}>
      <Heading style={heading}>
        Votre QR code est pr&ecirc;t ! &#127881;
      </Heading>

      <Text style={paragraph}>
        {businessName ? `Bonjour ${businessName},` : 'Bonjour,'}
      </Text>

      <Text style={paragraph}>
        Votre programme de fid&eacute;lit&eacute; est configur&eacute; et votre QR code est pr&ecirc;t &agrave; &ecirc;tre utilis&eacute;. Il ne reste plus qu&apos;&agrave; l&apos;imprimer et le placer en caisse !
      </Text>

      {/* CTA Download */}
      <Section style={ctaSection}>
        <Button style={ctaButton} href={`${appUrl}/dashboard/qr-download`}>
          T&eacute;l&eacute;charger mon QR code
        </Button>
      </Section>

      {/* Steps */}
      <Section style={stepsSection}>
        <Text style={stepsTitle}>3 &eacute;tapes pour lancer votre programme :</Text>

        <Section style={stepBox}>
          <Text style={stepNumber}>1</Text>
          <Text style={stepText}>
            <strong>T&eacute;l&eacute;chargez</strong> votre QR code depuis le bouton ci-dessus
          </Text>
        </Section>

        <Section style={stepBox}>
          <Text style={stepNumber}>2</Text>
          <Text style={stepText}>
            <strong>Imprimez-le</strong> et placez-le pr&egrave;s de votre caisse ou comptoir
          </Text>
        </Section>

        <Section style={stepBox}>
          <Text style={stepNumber}>3</Text>
          <Text style={stepText}>
            <strong>Proposez &agrave; vos clients</strong> de scanner pour s&apos;inscrire &agrave; votre programme de fid&eacute;lit&eacute;
          </Text>
        </Section>
      </Section>

      <Text style={tipText}>
        &#128161; Astuce : proposez le scan d&egrave;s le passage en caisse. Un simple &laquo; Vous voulez cumuler vos points fid&eacute;lit&eacute; ? &raquo; suffit !
      </Text>

      <Text style={signature}>
        L&apos;&eacute;quipe Qarte
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
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
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

const stepsSection = {
  margin: '24px 0',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
};

const stepsTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const stepBox = {
  margin: '0 0 12px 0',
  paddingLeft: '8px',
};

const stepNumber = {
  color: '#4b0082',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
  display: 'inline',
};

const stepText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
  display: 'inline',
  paddingLeft: '8px',
};

const tipText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  margin: '16px 0 24px 0',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '12px 16px',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default QRCodeEmail;
