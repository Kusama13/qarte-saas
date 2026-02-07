import {
  Button,
  Heading,
  Text,
  Section,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface QRCodeEmailProps {
  menuUrl?: string;
  businessName?: string;
  qrCodeUrl?: string;
  designedQrCodeUrl?: string;
}

export function QRCodeEmail({ menuUrl, businessName, qrCodeUrl, designedQrCodeUrl }: QRCodeEmailProps) {
  return (
    <BaseLayout preview="Votre QR code menu est prêt">
      {/* Qarte Header */}
      <Section style={headerSection}>
        <Text style={headerText}>
          Fidélisez vos clients avec Qarte
        </Text>
      </Section>

      <Heading style={heading}>
        Votre QR code est prêt
      </Heading>

      <Text style={paragraph}>
        {businessName ? `Bonjour ${businessName},` : 'Bonjour,'}
      </Text>

      <Text style={paragraph}>
        Merci d&apos;avoir utilisé notre générateur de QR code menu. Vous trouverez ci-dessous vos liens de téléchargement.
      </Text>

      {/* Download Links */}
      <Section style={linksSection}>
        <Text style={linksSectionTitle}>Vos QR codes à télécharger :</Text>

        <Section style={linkBox}>
          <Text style={linkLabel}>QR Code Simple</Text>
          <Text style={linkDescription}>Format standard, idéal pour une utilisation rapide</Text>
          {qrCodeUrl ? (
            <Link href={qrCodeUrl} style={downloadLink}>
              Télécharger le QR code simple
            </Link>
          ) : (
            <Text style={linkNote}>Disponible sur la page de téléchargement</Text>
          )}
        </Section>

        <Section style={linkBox}>
          <Text style={linkLabel}>QR Code Design</Text>
          <Text style={linkDescription}>Avec votre logo et couleurs personnalisées</Text>
          {designedQrCodeUrl ? (
            <Link href={designedQrCodeUrl} style={downloadLink}>
              Télécharger le QR code design
            </Link>
          ) : (
            <Text style={linkNote}>Disponible sur la page de téléchargement</Text>
          )}
        </Section>
      </Section>

      {menuUrl && (
        <Section style={urlBox}>
          <Text style={urlLabel}>Lien de votre menu :</Text>
          <Text style={urlText}>{menuUrl}</Text>
        </Section>
      )}

      <Text style={tipText}>
        Conseil : Testez votre QR code avec votre téléphone avant de l&apos;imprimer.
      </Text>

      {/* Qarte CTA */}
      <Section style={ctaBox}>
        <Text style={ctaTitle}>Envie d&apos;aller plus loin ?</Text>
        <Text style={ctaText}>
          Créez votre carte de fidélité digitale et augmentez la fréquence de visite de vos clients.
        </Text>
        <Button style={ctaButton} href="https://getqarte.com">
          Découvrir Qarte — essai 15 jours
        </Button>
      </Section>

      <Text style={signature}>
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

const headerSection = {
  backgroundColor: '#6366f1',
  borderRadius: '12px',
  padding: '16px 24px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.02em',
};

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

const linksSection = {
  margin: '24px 0',
};

const linksSectionTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const linkBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 12px 0',
  borderLeft: '4px solid #6366f1',
};

const linkLabel = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const linkDescription = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0 0 12px 0',
};

const downloadLink = {
  color: '#6366f1',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'underline',
};

const linkNote = {
  color: '#94a3b8',
  fontSize: '13px',
  fontStyle: 'italic' as const,
  margin: '0',
};

const urlBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
};

const urlLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
};

const urlText = {
  color: '#334155',
  fontSize: '14px',
  fontFamily: 'monospace',
  margin: '0',
  wordBreak: 'break-all' as const,
};

const tipText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic' as const,
  margin: '16px 0 24px 0',
  textAlign: 'center' as const,
};

const ctaBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const ctaTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const ctaText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 12px 0',
};

const ctaButton = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
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

export default QRCodeEmail;
