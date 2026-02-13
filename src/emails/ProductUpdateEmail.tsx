import {
  Button,
  Heading,
  Text,
  Section,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface ProductUpdateEmailProps {
  shopName: string;
  merchantId: string;
  referralCode?: string;
}

export function ProductUpdateEmail({ shopName, merchantId, referralCode }: ProductUpdateEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, d\u00e9couvrez les nouveaut\u00e9s Qarte de la semaine`}>
      <Heading style={heading}>
        Quoi de neuf chez Qarte ?
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        On a travaill&eacute; dur ces derniers jours pour vous donner encore plus
        d&apos;outils. Voici ce qui est nouveau :
      </Text>

      {/* 1. Parrainage */}
      <Section style={featureBoxViolet}>
        <Text style={featureBadgeViolet}>Nouveau</Text>
        <Text style={featureTitle}>Programme de parrainage</Text>
        <Text style={featureText}>
          Vos client(e)s peuvent maintenant inviter leurs proches et &ecirc;tre
          r&eacute;compens&eacute;(e)s. Vous choisissez la r&eacute;compense du parrain
          et du filleul &mdash; tout est automatique.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonViolet} href="https://getqarte.com/dashboard/program?section=referral">
          Activer le parrainage
        </Button>
      </Section>

      {/* 2. R&eacute;seaux sociaux */}
      <Section style={featureBoxBlue}>
        <Text style={featureTitle}>Ajoutez vos r&eacute;seaux sociaux</Text>
        <Text style={featureText}>
          Instagram, Facebook, TikTok, lien de r&eacute;servation&hellip; Vos client(e)s
          les retrouvent directement sur leur carte de fid&eacute;lit&eacute;.
          Un clic pour vous suivre, un clic pour r&eacute;server.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonBlue} href="https://getqarte.com/dashboard/program?section=social">
          Ajouter mes r&eacute;seaux
        </Button>
      </Section>

      {/* 3. Nouveau design */}
      <Section style={featureBoxIndigo}>
        <Text style={featureBadgeIndigo}>Nouveau</Text>
        <Text style={featureTitle}>Nouveau design de la carte client</Text>
        <Text style={featureText}>
          La page de fid&eacute;lit&eacute; de vos client(e)s a &eacute;t&eacute;
          enti&egrave;rement redessin&eacute;e : plus claire, plus rapide, plus belle.
          Vos client(e)s vont adorer.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonIndigo} href={`https://getqarte.com/customer/card/${merchantId}?preview=true`}>
          Voir le nouveau design
        </Button>
      </Section>

      {/* 4. Article blog */}
      <Section style={blogBox}>
        <Text style={blogLabel}>Sur le blog</Text>
        <Text style={blogTitle}>
          Comment mettre en place un programme de fid&eacute;lit&eacute; efficace
          pour votre onglerie ?
        </Text>
        <Text style={blogText}>
          D&eacute;couvrez notre guide complet avec des conseils concrets
          pour fid&eacute;liser vos client(e)s.
        </Text>
        <Link href="https://getqarte.com/blog/programme-fidelite-onglerie-guide" style={blogLink}>
          Lire l&apos;article &rarr;
        </Link>
      </Section>

      {/* 5. Parrainage commerçant */}
      {referralCode && (
        <Section style={referralBox}>
          <Text style={referralTitle}>Recommandez Qarte, gagnez 10&euro;</Text>
          <Text style={referralText}>
            Vous connaissez un(e) commer&ccedil;ant(e) dans la beaut&eacute; ?
            Recommandez-lui Qarte et recevez chacun <strong>10&euro; de r&eacute;duction</strong> sur
            votre prochain mois.
          </Text>
          <Text style={referralCodeStyle}>Votre code : <strong>{referralCode}</strong></Text>
          <Text style={referralHint}>
            Votre filleul nous communique votre code apr&egrave;s son inscription
            et la r&eacute;duction est appliqu&eacute;e &agrave; chacun.
          </Text>
        </Section>
      )}

      <Text style={signature}>
        &Agrave; tr&egrave;s vite,
        <br />
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

const featureBoxViolet = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #7c3aed',
};

const featureBoxBlue = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #3b82f6',
};

const featureBoxIndigo = {
  backgroundColor: '#eef2ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0 0',
  borderLeft: '4px solid #6366f1',
};

const featureBadgeViolet = {
  color: '#7c3aed',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const featureBadgeIndigo = {
  color: '#6366f1',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const featureTitle = {
  color: '#1a1a1a',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const featureText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '16px 0 28px 0',
};

const buttonViolet = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const buttonBlue = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const buttonIndigo = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const blogBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
};

const blogLabel = {
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const blogTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  lineHeight: '1.4',
  margin: '0 0 6px 0',
};

const blogText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
};

const blogLink = {
  color: '#4b0082',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
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

const referralCodeStyle = {
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

export default ProductUpdateEmail;
