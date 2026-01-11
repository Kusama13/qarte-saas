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
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Qarte</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Qarte. Tous droits réservés.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://getqarte.com" style={link}>Site web</Link>
              {' • '}
              <Link href="https://getqarte.com/contact" style={link}>Contact</Link>
              {' • '}
              <Link href="https://getqarte.com/politique-confidentialite" style={link}>Confidentialité</Link>
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
  backgroundColor: '#654EDA',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
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

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '0',
};

const link = {
  color: '#654EDA',
  textDecoration: 'none',
};

export default BaseLayout;
