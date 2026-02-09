import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface InactiveMerchantDay14EmailProps {
  shopName: string;
  rewardDescription?: string;
  stampsRequired?: number;
}

export function InactiveMerchantDay14Email({
  shopName,
  rewardDescription,
  stampsRequired,
}: InactiveMerchantDay14EmailProps) {
  return (
    <BaseLayout preview={`${shopName}, 2 semaines sans passage — voici comment relancer`}>
      <Heading style={heading}>
        Comment vos concurrents fidélisent leurs clients
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Saviez-vous que les commerces utilisant un programme de fidélité digital
        voient <strong>+40% de retour client</strong> en moyenne ? Votre programme est prêt
        — il ne manque que l&apos;habitude.
      </Text>

      <Section style={challengeBox}>
        <Text style={challengeTitle}>Le défi de la semaine</Text>
        <Text style={challengeText}>
          Proposez à chaque client de scanner votre QR code.
          Objectif : <strong>10 premiers scans d&apos;ici vendredi</strong>.
        </Text>
      </Section>

      <Section style={scriptBox}>
        <Text style={scriptTitle}>Que dire à vos clients ?</Text>
        <Text style={scriptText}>
          &quot;On a lancé une carte de fidélité digitale, scannez ce QR code
          {rewardDescription && stampsRequired
            ? ` et après ${stampsRequired} passages, vous gagnez ${rewardDescription}`
            : ' et cumulez des points à chaque passage'
          }. C&apos;est rapide et sans app à télécharger.&quot;
        </Text>
      </Section>

      <Hr style={divider} />

      {rewardDescription && (
        <Section style={rewardBox}>
          <Text style={rewardLabel}>Votre récompense actuelle :</Text>
          <Text style={rewardText}>
            {rewardDescription}
            {stampsRequired ? ` après ${stampsRequired} passages` : ''}
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard">
          Voir mon programme et mes statistiques
        </Button>
      </Section>

      <Text style={paragraph}>
        Vous n&apos;osez pas le proposer ? On vous aide à trouver les mots
        — répondez à cet email ou écrivez-nous sur WhatsApp.
      </Text>

      <Section style={buttonContainer}>
        <Button style={whatsappButton} href="https://wa.me/33607447420?text=Bonjour%2C%20j%27aimerais%20des%20conseils%20pour%20proposer%20Qarte%20%C3%A0%20mes%20clients">
          Demander des conseils
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

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const challengeBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '2px solid #4b0082',
};

const challengeTitle = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
};

const challengeText = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const scriptBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
  borderLeft: '4px solid #4b0082',
};

const scriptTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const scriptText = {
  color: '#4a5568',
  fontSize: '15px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const rewardBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
  border: '1px solid #bbf7d0',
  textAlign: 'center' as const,
};

const rewardLabel = {
  color: '#166534',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
};

const rewardText = {
  color: '#15803d',
  fontSize: '16px',
  fontWeight: '600',
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

export default InactiveMerchantDay14Email;
