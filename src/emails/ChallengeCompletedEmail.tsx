import {
  Button,
  Heading,
  Text,
  Section,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface ChallengeCompletedEmailProps {
  shopName: string;
  promoCode: string;
  locale?: EmailLocale;
}

export function ChallengeCompletedEmail({ shopName, promoCode, locale = 'fr' }: ChallengeCompletedEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('challengeCompleted.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('challengeCompleted.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('challengeCompleted.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t('challengeCompleted.intro')}
      </Text>

      <Section style={promoBox}>
        <Text style={promoLabel}>{t('challengeCompleted.promoLabel')}</Text>
        <Text style={promoCodeStyle}>{promoCode}</Text>
        <Text style={promoValue}>
          Premier mois à <strong>9€</strong> au lieu de 19€
        </Text>
        <Text style={promoExpiry}>
          Valable <strong>24 heures seulement</strong>
        </Text>
      </Section>

      <Section style={annualBox}>
        <Text style={promoLabel}>Offre annuelle</Text>
        <Text style={annualCodeStyle}>QARTEPROEHJT</Text>
        <Text style={promoValue}>
          <strong>20€ de réduction</strong> sur l&apos;abonnement annuel
        </Text>
        <Text style={annualDetail}>
          170€/an au lieu de 190€ — soit <strong>14,17€/mois</strong>
        </Text>
        <Text style={promoExpiry}>
          Valable <strong>24 heures seulement</strong>
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://getqarte.com/dashboard/subscription">
          {t('challengeCompleted.ctaDashboard')}
        </Button>
      </Section>

      <Hr style={divider} />

      <Section style={recapBox}>
        <Text style={recapTitle}>Ce que tu as d&eacute;j&agrave; accompli :</Text>
        <Text style={recapItem}>Ton programme de fid&eacute;lit&eacute; est en ligne</Text>
        <Text style={recapItem}>5 clients fid&eacute;lis&eacute;s en 3 jours</Text>
        <Text style={recapItem}>Tes clients reviendront d&apos;eux-m&ecirc;mes</Text>
      </Section>

      <Text style={paragraph}>
        Ne laisse pas retomber cette dynamique — active ton abonnement
        maintenant et continue &agrave; fid&eacute;liser tes clients sans interruption.
      </Text>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          Ces codes expirent dans <strong>24h</strong>.
          Après ça, l&apos;abonnement sera au tarif normal.
        </Text>
      </Section>

      <Text style={paragraph}>
        Une question ? R&eacute;ponds &agrave; cet email.
      </Text>

      <Text style={signature}>
        {t('challengeCompleted.signature')}
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

const promoBox = {
  backgroundColor: '#f0edfc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #4b0082',
  textAlign: 'center' as const,
};

const promoLabel = {
  color: '#4b0082',
  fontSize: '13px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  margin: '0 0 8px 0',
};

const promoCodeStyle = {
  color: '#4b0082',
  fontSize: '32px',
  fontWeight: '800',
  letterSpacing: '0.15em',
  margin: '0 0 12px 0',
};

const promoValue = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const promoExpiry = {
  color: '#e53e3e',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const annualBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 24px 0',
  border: '2px solid #16a34a',
  textAlign: 'center' as const,
};

const annualCodeStyle = {
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: '800',
  letterSpacing: '0.1em',
  margin: '0 0 12px 0',
};

const annualDetail = {
  color: '#4a5568',
  fontSize: '15px',
  margin: '0 0 8px 0',
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

const divider = {
  borderColor: '#e8e8e8',
  margin: '28px 0',
};

const recapBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const recapTitle = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const recapItem = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.8',
  margin: '0',
  paddingLeft: '16px',
};

const urgencyBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px 0',
  border: '1px solid #fde68a',
};

const urgencyText = {
  color: '#92400e',
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

export default ChallengeCompletedEmail;
