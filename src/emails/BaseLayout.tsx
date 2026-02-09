import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://getqarte.com/images/email-banner.png"
              alt="Qarte"
              width="600"
              style={bannerImg}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerSocial}>
              <Link href="https://www.instagram.com/getqarte/" style={socialLink}>Instagram</Link>
              {' • '}
              <Link href="https://www.facebook.com/profile.php?id=61587048661028" style={socialLink}>Facebook</Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Qarte. Tous droits réservés.
            </Text>
            <Text style={footerAddress}>
              Qarte — 128 Rue la Boétie, 75008 Paris, France
            </Text>
            <Text style={footerLinks}>
              <Link href="https://getqarte.com" style={link}>Site web</Link>
              {' • '}
              <Link href="https://getqarte.com/contact" style={link}>Contact</Link>
              {' • '}
              <Link href="https://getqarte.com/politique-confidentialite" style={link}>Confidentialité</Link>
            </Text>
            <Text style={unsubscribeText}>
              <Link href="mailto:contact@getqarte.com?subject=Désinscription" style={unsubscribeLink}>
                Se désinscrire des emails
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginTop: '40px',
  marginBottom: '40px',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  maxWidth: '600px',
};

const header = {
  padding: '0',
  textAlign: 'center' as const,
};

const bannerImg = {
  width: '100%',
  display: 'block' as const,
};

const content = {
  padding: '40px',
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '0 0 8px 0',
};

const footerAddress = {
  color: '#8898aa',
  fontSize: '11px',
  margin: '0 0 8px 0',
};

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '0',
};

const link = {
  color: '#4b0082',
  textDecoration: 'none',
};

const footerSocial = {
  fontSize: '13px',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const socialLink = {
  color: '#4b0082',
  textDecoration: 'none',
  fontWeight: '600',
};

const unsubscribeText = {
  color: '#8898aa',
  fontSize: '11px',
  marginTop: '16px',
};

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};

export default BaseLayout;
