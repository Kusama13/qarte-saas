import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface GracePeriodSetupEmailProps {
  shopName: string;
  daysUntilDeletion: number;
}

export function GracePeriodSetupEmail({ shopName, daysUntilDeletion }: GracePeriodSetupEmailProps) {
  return (
    <BaseLayout preview={`${shopName}, ton essai est termin&eacute; — on peut encore t'aider`}>
      <Heading style={heading}>
        Ton essai est termin&eacute; — il n&apos;est pas trop tard
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ton essai est termin&eacute;, mais ton programme de fid&eacute;lit&eacute;
        n&apos;a jamais &eacute;t&eacute; configur&eacute;. On comprend que le quotidien passe vite.
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          Tes donn&eacute;es sont conserv&eacute;es encore <strong>{daysUntilDeletion} jour{daysUntilDeletion > 1 ? 's' : ''}</strong>.
        </Text>
      </Section>

      <Hr style={divider} />

      <Section style={offerBox}>
        <Text style={offerTitle}>On le fait ensemble en 2 minutes</Text>
        <Text style={offerText}>
          R&eacute;ponds &agrave; cet email et on configure
          ton programme <strong>pendant que tu es avec tes clients</strong>.
          Tout ce qu&apos;on a besoin :
        </Text>
        <Text style={offerList}>
          &bull; Quelle récompense offrir (ex: &quot;1 soin offert après 10 visites&quot;)<br />
          &bull; C&apos;est tout. On s&apos;occupe du reste.
        </Text>
      </Section>

      <Text style={paragraph}>
        Ou fais-le toi-m&ecirc;me en 3 minutes :
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/program">
          Configurer mon programme
        </Button>
      </Section>

      <Section style={reassuranceBox}>
        <Text style={reassuranceText}>
          Apr&egrave;s configuration, tu pourras r&eacute;activer ton abonnement &agrave;
          <strong> 9&euro;/mois le premier mois</strong> (au lieu de 19&euro;).
        </Text>
      </Section>

      <Section style={socialProofBox}>
        <Text style={socialProofText}>
          Des centaines de pros ont déjà configuré leur programme en quelques minutes.{' '}
          <a href="https://getqarte.com/pros" style={socialProofLink}>Voir leurs programmes &#8594;</a>
        </Text>
      </Section>

      <Text style={signature}>
        On est l&agrave; pour toi,
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

const infoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  border: '1px solid #fde68a',
};

const infoText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const offerBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 8px 0',
  border: '2px solid #10b981',
};

const offerTitle = {
  color: '#065f46',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 12px 0',
};

const offerText = {
  color: '#065f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const offerList = {
  color: '#065f46',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
  paddingLeft: '8px',
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

const reassuranceBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
};

const reassuranceText = {
  color: '#4b0082',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

const socialProofBox = {
  backgroundColor: '#f5f3ff',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const socialProofText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

const socialProofLink = {
  color: '#4b0082',
  fontWeight: '600' as const,
  textDecoration: 'underline',
};

export default GracePeriodSetupEmail;
