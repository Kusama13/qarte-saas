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

interface QRCodeEmailProps {
  shopName: string;
  rewardDescription?: string;
  stampsRequired?: number;
  primaryColor?: string;
  logoUrl?: string;
  tier2Enabled?: boolean;
  tier2StampsRequired?: number | null;
  tier2RewardDescription?: string | null;
  referralCode?: string;
  loyaltyMode?: 'visit' | 'cagnotte';
}

// Lighten a hex color by mixing with white
function lightenColor(hex: string, amount: number = 0.4): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

export function QRCodeEmail({
  shopName,
  rewardDescription,
  stampsRequired,
  primaryColor = '#4b0082',
  logoUrl,
  tier2Enabled,
  tier2StampsRequired,
  tier2RewardDescription,
  referralCode,
  loyaltyMode = 'visit',
}: QRCodeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
  const dashboardUrl = `${appUrl}/dashboard/qr-download`;
  const lightColor = lightenColor(primaryColor);

  return (
    <BaseLayout preview={`${shopName}, ton QR code et kit promo sont pr&ecirc;ts !`}>
      <Heading style={heading}>
        Tout est pr&ecirc;t, lance-toi !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ton programme de fid&eacute;lit&eacute; est configur&eacute;. Voici tout ce qu&apos;il te faut pour d&eacute;marrer : ton <strong>QR code</strong>{rewardDescription ? <> et ton <strong>kit r&eacute;seaux sociaux</strong></> : null}.
      </Text>

      {/* ===== SECTION 1: QR CODE ===== */}
      <Section style={sectionCard}>
        <Text style={sectionTitle}>Ton QR code</Text>
        <Text style={sectionDesc}>
          T&eacute;l&eacute;charge-le et garde-le sur ton t&eacute;l&eacute;phone. Montre-le &agrave; tes client(e)s au moment de payer.
        </Text>

        <Section style={stepsBox}>
          <Text style={stepItem}>
            <strong style={{ color: primaryColor }}>1.</strong> T&eacute;l&eacute;charge le QR code depuis ton tableau de bord
          </Text>
          <Text style={stepItem}>
            <strong style={{ color: primaryColor }}>2.</strong> Montre-le &agrave; chaque client(e) au passage en caisse
          </Text>
          <Text style={stepItem}>
            <strong style={{ color: primaryColor }}>3.</strong> Un simple &laquo; Vous voulez cumuler vos points ? &raquo; suffit !
          </Text>
        </Section>
      </Section>

      {/* ===== SECTION 2: SOCIAL KIT (conditional) ===== */}
      {rewardDescription && (
        <>
          <Section style={sectionCard}>
            <Text style={sectionTitle}>Ton kit r&eacute;seaux sociaux</Text>
            <Text style={sectionDesc}>
              Un visuel pr&ecirc;t &agrave; poster sur Instagram, Facebook ou WhatsApp pour annoncer ton programme.
            </Text>

            {/* Visual preview */}
            <Section style={{ ...visualPreview, background: `linear-gradient(135deg, ${primaryColor} 0%, ${lightColor} 100%)` }}>
              <div style={{ textAlign: 'center' as const }}>
                {logoUrl && (
                  <Img
                    src={logoUrl}
                    alt={shopName}
                    width="48"
                    height="48"
                    style={previewLogo}
                  />
                )}
                <Text style={previewShopName}>{shopName}</Text>
                <Section style={previewRewardBox}>
                  <Text style={{ ...previewRewardLabel, color: primaryColor }}>{loyaltyMode === 'cagnotte' ? 'Votre cagnotte' : 'Votre r\u00e9compense'}</Text>
                  <Text style={previewRewardText}>{rewardDescription}</Text>
                  {stampsRequired && (
                    <Text style={{ ...previewRewardStamps, color: primaryColor }}>
                      Apr&egrave;s {stampsRequired} passage{stampsRequired > 1 ? 's' : ''}
                    </Text>
                  )}
                </Section>
                {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
                  <Section style={{ ...previewRewardBox, marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                    <Text style={{ ...previewRewardLabel, color: '#f59e0b' }}>Palier 2</Text>
                    <Text style={{ ...previewRewardText, fontSize: '14px' }}>{tier2RewardDescription}</Text>
                    <Text style={{ ...previewRewardStamps, color: '#f59e0b' }}>
                      Apr&egrave;s {tier2StampsRequired} passage{tier2StampsRequired > 1 ? 's' : ''}
                    </Text>
                  </Section>
                )}
              </div>
            </Section>
          </Section>

          {/* Captions */}
          <Section style={sectionCard}>
            <Text style={sectionTitle}>L&eacute;gendes pr&ecirc;tes &agrave; copier</Text>

            <Section style={captionBox}>
              <Text style={captionLabel}>Option 1 — Simple et efficace</Text>
              <Text style={captionText}>
                {loyaltyMode === 'cagnotte' ? (
                  <>Votre fid&eacute;lit&eacute; m&eacute;rite d&apos;&ecirc;tre r&eacute;compens&eacute;e ! {stampsRequired} passages chez {shopName} = {rewardDescription} sur vos d&eacute;penses.{' '}Demandez &agrave; scanner le QR code ! #fid&eacute;lit&eacute; #{shopName.replace(/\s+/g, '')}</>
                ) : (
                  <>Votre fid&eacute;lit&eacute; m&eacute;rite d&apos;&ecirc;tre r&eacute;compens&eacute;e ! Apr&egrave;s {stampsRequired} passages chez {shopName}, recevez {rewardDescription}.
                {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
                  <> Et apr&egrave;s {tier2StampsRequired} passages : {tier2RewardDescription} !</>
                )}
                {' '}Demandez &agrave; scanner le QR code ! #fid&eacute;lit&eacute; #{shopName.replace(/\s+/g, '')}</>
                )}
              </Text>
            </Section>

            <Section style={captionBox}>
              <Text style={captionLabel}>Option 2 — Engageante</Text>
              <Text style={captionText}>
                {loyaltyMode === 'cagnotte' ? (
                  <>NOUVEAU chez {shopName} ! On lance notre programme de fid&eacute;lit&eacute; digitale. Pas d&apos;appli, pas de carte &agrave; perdre &mdash; juste un scan rapide. {stampsRequired} passages = {rewardDescription} sur vos d&eacute;penses ! &Agrave; bient&ocirc;t</>
                ) : (
                  <>NOUVEAU chez {shopName} ! On lance notre carte de fid&eacute;lit&eacute; digitale. Pas d&apos;appli, pas de carte &agrave; perdre &mdash; juste un scan rapide. Votre r&eacute;compense ? {rewardDescription} !
                {tier2Enabled && tier2RewardDescription && tier2StampsRequired && (
                  <> Et {tier2RewardDescription} apr&egrave;s {tier2StampsRequired} passages !</>
                )}
                {' '}&Agrave; bient&ocirc;t</>
                )}
              </Text>
            </Section>
          </Section>
        </>
      )}

      {/* CTA */}
      <Section style={ctaContainer}>
        <Button style={ctaButton} href={dashboardUrl}>
          Voir mon QR code & kit promo
        </Button>
      </Section>

      <Text style={tipBox}>
        <strong>Astuce :</strong> garde le QR code sur ton t&eacute;l&eacute;phone et propose le scan d&egrave;s le passage en caisse. Poste le visuel en story Instagram pour un maximum de visibilit&eacute; !
      </Text>

      {referralCode && (
        <Section style={referralSection}>
          <Text style={referralTitle}>Gagne 10&euro; de r&eacute;duction</Text>
          <Text style={referralText}>
            Tu connais un(e) commer&ccedil;ant(e) dans la beaut&eacute; ?
            Recommande-lui Qarte : <strong>10&euro; de r&eacute;duction</strong> chacun sur le prochain mois.
          </Text>
          <Text style={referralCodeStyle}>Ton code : <strong>{referralCode}</strong></Text>
          <Text style={referralHint}>
            Ton filleul nous communique ton code apr&egrave;s son inscription et la r&eacute;duction est appliqu&eacute;e &agrave; chacun.
          </Text>
        </Section>
      )}

      <Hr style={divider} />

      <Text style={paragraph}>
        Besoin d&apos;aide ? R&eacute;ponds &agrave; cet email, on te r&eacute;pond rapidement.
      </Text>

      <Text style={signature}>
        L&apos;&eacute;quipe Qarte
      </Text>
    </BaseLayout>
  );
}

// ===== STYLES =====

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
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

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const sectionCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '16px',
  padding: '24px',
  margin: '0 0 16px 0',
};

const sectionEmoji = {
  fontSize: '28px',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const sectionTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const sectionDesc = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const stepsBox = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px 20px',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '2',
  margin: '0',
};

const visualPreview = {
  borderRadius: '12px',
  padding: '24px 16px',
  textAlign: 'center' as const,
};

const previewLogo = {
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.3)',
  margin: '0 auto 8px auto',
  objectFit: 'cover' as const,
};

const previewShopName = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '800',
  margin: '0 0 12px 0',
};

const previewRewardBox = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: '10px',
  padding: '12px',
};

const previewRewardLabel = {
  fontSize: '9px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 4px 0',
};

const previewRewardText = {
  color: '#1a1a2e',
  fontSize: '16px',
  fontWeight: '800',
  margin: '0 0 4px 0',
};

const previewRewardStamps = {
  fontSize: '11px',
  fontWeight: '700',
  margin: '0',
};

const captionBox = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 10px 0',
};

const captionLabel = {
  color: '#4b0082',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 6px 0',
};

const captionText = {
  color: '#4a5568',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const ctaButton = {
  backgroundColor: '#4b0082',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 36px',
};

const tipBox = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
  backgroundColor: '#fef3c7',
  borderRadius: '10px',
  padding: '14px 18px',
};

const referralSection = {
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

export default QRCodeEmail;
