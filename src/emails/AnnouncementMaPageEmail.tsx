import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface AnnouncementMaPageEmailProps {
  shopName: string;
  slug: string;
  isSubscribed?: boolean;
  locale?: EmailLocale;
}

export function AnnouncementMaPageEmail({ shopName, slug, isSubscribed = true, locale = 'fr' }: AnnouncementMaPageEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('announcementMaPage.preview', { shopName })} locale={locale}>
      <Heading style={heading}>
        {t('announcementMaPage.heading')}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('announcementMaPage.greeting', { shopName }) }} />

      <Text style={paragraph}>
        Qarte, ce n&apos;est plus seulement un programme de fid&eacute;lit&eacute;.
        C&apos;est maintenant un vrai outil pour <strong>attirer de nouveaux clients</strong> et
        d&eacute;velopper ton activit&eacute;. Voici ce qui est nouveau :
      </Text>

      {/* 1. Ma Page */}
      <Section style={featureBoxViolet}>
        <Text style={featureBadgeViolet}>Nouveau</Text>
        <Text style={featureTitle}>Ta page pro est en ligne</Text>
        <Text style={featureText}>
          Chaque commerce sur Qarte a d&eacute;sormais sa propre page publique :
          tes prestations, tes tarifs, tes photos, tes r&eacute;seaux sociaux et
          un lien de r&eacute;servation. Le tout optimis&eacute; pour Google.
          Un seul lien &agrave; partager, et tes futurs clients te trouvent en un clic.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonViolet} href={`https://getqarte.com/p/${slug}`}>
          Voir ma page
        </Button>
      </Section>

      {/* 2. Offre de bienvenue */}
      <Section style={featureBoxBlue}>
        <Text style={featureBadgeBlue}>Acquisition</Text>
        <Text style={featureTitle}>Offre de bienvenue : attire de nouveaux clients</Text>
        <Text style={featureText}>
          Propose une offre sp&eacute;ciale aux nouveaux clients qui d&eacute;couvrent
          ta page &mdash; par exemple &laquo;&nbsp;-20&nbsp;% sur la 1&egrave;re visite&nbsp;&raquo;.
          Ils s&apos;inscrivent, re&ccedil;oivent leur bon, et viennent chez toi.
          Tout est automatique.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={buttonBlue} href="https://getqarte.com/dashboard/referrals">
          Activer l&apos;offre de bienvenue
        </Button>
      </Section>

      {/* Résumé */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Fid&eacute;liser + attirer = un seul outil</Text>
        <Text style={summaryText}>
          Programme de fid&eacute;lit&eacute;, parrainage, offre de bienvenue, page pro&hellip;
          Qarte te donne tout ce qu&apos;il faut pour garder tes clients
          et en attirer de nouveaux. Tout &ccedil;a dans un seul abonnement.
        </Text>
      </Section>

      {/* Section non-abonnés */}
      {!isSubscribed && (
        <Section style={resubscribeBox}>
          <Text style={resubscribeTitle}>Tu n&apos;es plus abonn&eacute;(e)&nbsp;?</Text>
          <Text style={resubscribeText}>
            On a ajout&eacute; beaucoup de nouveaut&eacute;s depuis ton d&eacute;part.
            C&apos;est le moment id&eacute;al pour revenir et profiter de tout ce que
            Qarte peut apporter &agrave; ton commerce.
          </Text>
          <Section style={buttonContainer}>
            <Button style={buttonGreen} href="https://getqarte.com/dashboard/subscription">
              Se r&eacute;abonner maintenant
            </Button>
          </Section>
        </Section>
      )}

      <Text style={signature}>
        {t('announcementMaPage.signature')}
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

const featureBadgeViolet = {
  color: '#7c3aed',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px 0',
};

const featureBadgeBlue = {
  color: '#3b82f6',
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

const buttonGreen = {
  backgroundColor: '#059669',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
};

const summaryBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
};

const summaryTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const summaryText = {
  color: '#4a5568',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const resubscribeBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
  border: '1px solid #a7f3d0',
};

const resubscribeTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 8px 0',
};

const resubscribeText = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 4px 0',
};

const signature = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default AnnouncementMaPageEmail;
