import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface WelcomeEmailProps {
  shopName: string;
  slug?: string;
  trialDays?: number;
}

export function WelcomeEmail({ shopName, slug, trialDays = 7 }: WelcomeEmailProps) {
  const publicPageUrl = slug ? `https://getqarte.com/p/${slug}` : null;

  return (
    <BaseLayout preview={`${shopName}, ta page pro et ton programme de fidelite sont prets`}>
      <Heading style={heading}>
        Bienvenue {shopName} !
      </Heading>

      <Text style={paragraph}>
        Bonjour <strong>{shopName}</strong>,
      </Text>

      <Text style={paragraph}>
        Ton compte Qarte est cree. Tu as maintenant une <strong>page pro complete</strong> et
        un <strong>programme de fidelite</strong> prets a l&apos;emploi.
      </Text>

      <Text style={subheading}>
        Ce qui est deja pret pour toi
      </Text>

      <Section style={stepsBox}>
        <Text style={stepItem}>
          <strong>Ta page pro</strong> — bio, prestations, photos, horaires. Une seule page a partager, visible sur Google.
        </Text>
        <Text style={stepItem}>
          <strong>Ton planning en ligne</strong> — tes clientes voient tes dispos et reservent directement.
        </Text>
        <Text style={stepItem}>
          <strong>Ton programme de fidelite</strong> — tampons ou cagnotte, relances automatiques, avis Google.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/personalize">
          Personnalise ta page en 5 min
        </Button>
      </Section>

      {publicPageUrl && (
        <>
          <Hr style={divider} />

          <Text style={subheading}>
            Ta page publique est deja en ligne
          </Text>

          <Text style={paragraph}>
            Tes clientes y retrouvent ton salon, tes prestations, ton programme de fidelite
            et la prise de rendez-vous. Ajoute-la dans ta bio Instagram — c&apos;est mieux qu&apos;un Linktree.
          </Text>

          <Section style={buttonContainer}>
            <Button style={buttonSecondary} href={publicPageUrl}>
              Voir ma page publique
            </Button>
          </Section>
        </>
      )}

      <Text style={highlightBox}>
        <strong>Astuce :</strong> Configure une offre de bienvenue (ex : -20% premiere visite)
        depuis ton tableau de bord. Elle s&apos;affichera automatiquement sur ta page publique
        pour attirer de nouvelles clientes — sans depenser en publicite.
      </Text>

      <Hr style={divider} />

      <Text style={footerNote}>
        Tu as {trialDays} jours pour tout tester gratuitement, sans engagement.
      </Text>

      <Text style={paragraph}>
        Besoin d&apos;aide ? Reponds a cet email, on te guide.
      </Text>

      <Text style={signature}>
        L&apos;equipe Qarte
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
  margin: '0 0 20px 0',
};

const paragraph = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const highlightBox = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '1.6',
  backgroundColor: '#f0edfc',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px 0',
};

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
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

const stepsBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 8px 0',
};

const stepItem = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '2',
  margin: '0',
};

const footerNote = {
  color: '#718096',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default WelcomeEmail;
