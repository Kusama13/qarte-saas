import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
  Img,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface SocialKitEmailProps {
  shopName: string;
  rewardDescription: string;
  stampsRequired: number;
  primaryColor: string;
  logoUrl?: string;
  socialImageUrl?: string;
  tier2Enabled?: boolean;
  tier2StampsRequired?: number | null;
  tier2RewardDescription?: string | null;
}

export function SocialKitEmail({
  shopName,
  rewardDescription,
  stampsRequired,
  primaryColor,
  logoUrl,
  socialImageUrl,
  tier2Enabled,
  tier2StampsRequired,
  tier2RewardDescription,
}: SocialKitEmailProps) {
  const dashboardUrl = 'https://getqarte.com/dashboard/social-kit';

  return (
    <BaseLayout preview={`${shopName}, votre kit réseaux sociaux est prêt — partagez avec vos clients !`}>
      <Heading style={heading}>
        Votre programme est prêt, faites-le savoir !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Votre programme de fidélité est configuré. Il ne reste plus qu&apos;une chose :
        <strong> informer vos clients</strong>. On vous a préparé un visuel prêt à poster
        sur vos réseaux sociaux.
      </Text>

      {/* Image preview or styled card */}
      {socialImageUrl ? (
        <Section style={imageContainer}>
          <Img
            src={socialImageUrl}
            alt={`Visuel réseaux sociaux ${shopName}`}
            width="400"
            style={previewImage}
          />
        </Section>
      ) : (
        <Section style={cardPreview}>
          <div style={{ textAlign: 'center' as const }}>
            {logoUrl && (
              <Img
                src={logoUrl}
                alt={shopName}
                width="56"
                height="56"
                style={cardLogo}
              />
            )}
            <Text style={cardShopName}>{shopName}</Text>
            <Text style={cardSubtitle}>Programme de fidélité</Text>
            <Section style={cardRewardBox}>
              <Text style={cardRewardLabel}>Votre récompense</Text>
              <Text style={cardRewardText}>{rewardDescription}</Text>
              <Text style={{ ...cardRewardStamps, color: primaryColor }}>
                Après {stampsRequired} passage{stampsRequired > 1 ? 's' : ''}
              </Text>
            </Section>
            {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
              <Section style={{ ...cardRewardBox, marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                <Text style={{ ...cardRewardLabel, color: '#7C3AED' }}>Palier 2</Text>
                <Text style={{ ...cardRewardText, fontSize: '16px' }}>{tier2RewardDescription}</Text>
                <Text style={{ ...cardRewardStamps, color: '#7C3AED' }}>
                  Après {tier2StampsRequired} passage{tier2StampsRequired > 1 ? 's' : ''}
                </Text>
              </Section>
            )}
          </div>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          Télécharger mon visuel HD
        </Button>
      </Section>

      <Hr style={divider} />

      <Heading as="h2" style={subheading}>
        Légendes prêtes à copier-coller
      </Heading>

      <Text style={paragraph}>
        Choisissez celle qui vous ressemble et postez-la avec votre visuel :
      </Text>

      <Section style={captionBox}>
        <Text style={captionLabel}>Option 1 — Simple et efficace</Text>
        <Text style={captionText}>
          Votre fidélité mérite d&apos;être récompensée ! 🎁 Après {stampsRequired} passages chez {shopName},
          recevez {rewardDescription}.
          {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
            <> Et ce n&apos;est pas tout : après {tier2StampsRequired} passages, recevez {tier2RewardDescription} !</>
          )}
          {' '}Demandez à scanner le QR code lors de votre prochain rendez-vous !
          #fidélité #{shopName.replace(/\s+/g, '')}
        </Text>
      </Section>

      <Section style={captionBox}>
        <Text style={captionLabel}>Option 2 — Engageante</Text>
        <Text style={captionText}>
          NOUVEAU chez {shopName} ! ✨ On lance notre carte de fidélité digitale.
          Pas d&apos;application, pas de carte à perdre — juste un scan rapide à chaque visite.
          Votre récompense ? {rewardDescription} !
          {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
            <> Et après {tier2StampsRequired} passages : {tier2RewardDescription} !</>
          )}
          {' '}À bientôt 💜
        </Text>
      </Section>

      <Section style={captionBox}>
        <Text style={captionLabel}>Option 3 — Story Instagram</Text>
        <Text style={captionText}>
          La fidélité, ça se récompense ! 💅 Demandez à scanner le QR code en caisse.
          {rewardDescription} après {stampsRequired} passages.
          {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
            <> Et {tier2RewardDescription} après {tier2StampsRequired} passages !</>
          )}
          {' '}C&apos;est cadeau !
        </Text>
      </Section>

      <Hr style={divider} />

      <Heading as="h2" style={subheading}>
        Conseils pour maximiser l&apos;impact
      </Heading>

      <Section style={tipsBox}>
        <Text style={tipItem}>
          <strong>1.</strong> Postez en story ET en publication pour toucher plus de monde
        </Text>
        <Text style={tipItem}>
          <strong>2.</strong> Épinglez la publication en haut de votre profil
        </Text>
        <Text style={tipItem}>
          <strong>3.</strong> Parlez-en à chaque client(e) en caisse — le bouche-à-oreille fonctionne
        </Text>
        <Text style={tipItem}>
          <strong>4.</strong> Ajoutez le lien vers votre QR code dans votre bio Instagram
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonSecondary} href={dashboardUrl}>
          Voir mon kit complet
        </Button>
      </Section>

      <Text style={paragraph}>
        Besoin d&apos;aide pour poster ? Répondez à cet email ou contactez-nous
        sur WhatsApp, on vous guide !
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20poster%20sur%20mes%20r%C3%A9seaux">
          Nous contacter sur WhatsApp
        </Button>
      </Section>

      <Text style={signature}>
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

const subheading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 16px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
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

const buttonSecondary = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
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

// Card preview styles (HTML-styled preview when no image URL)
const imageContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const previewImage = {
  borderRadius: '16px',
  maxWidth: '100%',
  margin: '0 auto',
};

const cardPreview = {
  background: 'linear-gradient(135deg, #4b0082 0%, #9D8FE8 100%)',
  borderRadius: '16px',
  padding: '32px 24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const cardLogo = {
  borderRadius: '50%',
  border: '3px solid rgba(255,255,255,0.3)',
  margin: '0 auto 12px auto',
  objectFit: 'cover' as const,
};

const cardShopName = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '800',
  margin: '0 0 4px 0',
};

const cardSubtitle = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '10px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 16px 0',
};

const cardRewardBox = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: '12px',
  padding: '16px',
};

const cardRewardLabel = {
  color: '#4b0082',
  fontSize: '10px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
};

const cardRewardText = {
  color: '#1a1a2e',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 4px 0',
};

const cardRewardStamps = {
  fontSize: '12px',
  fontWeight: '700',
  margin: '0',
};

// Caption styles
const captionBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 12px 0',
};

const captionLabel = {
  color: '#4b0082',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const captionText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

// Tips styles
const tipsBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const tipItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default SocialKitEmail;
