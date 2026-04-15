import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
  Link,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface AmbassadorWelcomeEmailProps {
  firstName: string;
  affiliateSlug: string;
  signupUrl: string;
  homeUrl: string;
}

export function AmbassadorWelcomeEmail({
  firstName,
  affiliateSlug,
  signupUrl,
  homeUrl,
}: AmbassadorWelcomeEmailProps) {
  return (
    <BaseLayout preview={`${firstName}, ton lien ambassadeur Qarte est prêt !`} locale="fr">
      <Heading style={heading}>
        Bienvenue dans le programme ambassadeur, {firstName} !
      </Heading>

      <Text style={paragraph}>
        Ta candidature a été approuvée. Tu fais maintenant partie du programme ambassadeur Qarte.
        Chaque salon qui s&apos;abonne via ton lien te rapporte <strong>20% de commission récurrente</strong> — chaque mois, tant qu&apos;il reste abonné.
      </Text>

      <Section style={linkBox}>
        <Text style={linkTitle}>Ton lien d&apos;inscription</Text>
        <Text style={linkText}>
          <Link href={signupUrl} style={linkUrl}>{signupUrl}</Link>
        </Text>
        <Text style={linkHint}>Les pros qui cliquent arrivent directement sur la page d&apos;inscription Qarte avec ton code <strong>{affiliateSlug}</strong>.</Text>
      </Section>

      <Section style={linkBox2}>
        <Text style={linkTitle}>Ton lien page d&apos;accueil</Text>
        <Text style={linkText}>
          <Link href={homeUrl} style={linkUrl}>{homeUrl}</Link>
        </Text>
        <Text style={linkHint}>Ce lien mène à la page d&apos;accueil Qarte — idéal pour les réseaux sociaux ou un premier contact.</Text>
      </Section>

      <Hr style={divider} />

      <Section style={earningsBox}>
        <Text style={earningsTitle}>Comment ça marche</Text>
        <Text style={earningsItem}>&#x2713; Tu partages ton lien aux pros de la beauté que tu connais</Text>
        <Text style={earningsItem}>&#x2713; Elles testent Qarte gratuitement pendant 7 jours</Text>
        <Text style={earningsItem}>&#x2713; Si elles s&apos;abonnent, tu touches 4,80&euro;/mois par salon</Text>
        <Text style={earningsItem}>&#x2713; Les commissions sont versées chaque mois par virement</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={signupUrl}>
          Copier mon lien
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        Une question ? Réponds directement à cet email ou écris-nous à <Link href="mailto:hello@getqarte.com" style={linkUrl}>hello@getqarte.com</Link>.
      </Text>

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

const linkBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '20px 0 12px 0',
  borderLeft: '4px solid #4b0082',
};

const linkBox2 = {
  backgroundColor: '#f0f4ff',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 12px 0',
  borderLeft: '4px solid #6366f1',
};

const linkTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 6px 0',
};

const linkText = {
  margin: '0 0 6px 0',
};

const linkUrl = {
  color: '#4b0082',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
};

const linkHint = {
  color: '#718096',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};

const earningsBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
  borderLeft: '4px solid #10b981',
};

const earningsTitle = {
  color: '#065f46',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0 0 10px 0',
};

const earningsItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '20px 0 0 0',
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

const signature = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '24px 0 0 0',
};
