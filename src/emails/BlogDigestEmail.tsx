import {
  Button,
  Heading,
  Img,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import type { EmailLocale } from './translations';

interface BlogDigestEmailProps {
  shopName: string;
  articleTitle: string;
  articleDescription: string;
  articleCategory: string;
  articleReadTime: string;
  articleImageUrl: string;
  articleUrl: string;
  locale?: EmailLocale;
}

export function BlogDigestEmail({
  shopName,
  articleTitle,
  articleDescription,
  articleCategory,
  articleReadTime,
  articleImageUrl,
  articleUrl,
  locale = 'fr',
}: BlogDigestEmailProps) {
  const preview = `${articleTitle.slice(0, 90)}${articleTitle.length > 90 ? '…' : ''}`;

  return (
    <BaseLayout preview={preview} locale={locale}>
      <Text style={greeting}>Salut {shopName},</Text>
      <Text style={intro}>
        On a écrit un nouvel article pour toi. 5 à 10 minutes de lecture — pile ce qu&apos;il faut entre deux clientes.
      </Text>

      <Section style={card}>
        <Img
          src={articleImageUrl}
          alt={articleTitle}
          width="520"
          style={cover}
        />
        <Section style={cardBody}>
          <Text style={categoryTag}>
            {articleCategory} · {articleReadTime} de lecture
          </Text>
          <Heading as="h2" style={titleStyle}>
            {articleTitle}
          </Heading>
          <Text style={description}>{articleDescription}</Text>
          <Button href={articleUrl} style={cta}>
            Lire l&apos;article
          </Button>
        </Section>
      </Section>

      <Text style={outro}>
        À bientôt,
        <br />
        L&apos;équipe Qarte
      </Text>
    </BaseLayout>
  );
}

export default BlogDigestEmail;

const greeting = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 12px 0',
};

const intro = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 28px 0',
};

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  margin: '0 0 28px 0',
};

const cover = {
  width: '100%',
  height: 'auto' as const,
  display: 'block' as const,
};

const cardBody = {
  padding: '24px',
};

const categoryTag = {
  color: '#6366f1',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  margin: '0 0 10px 0',
};

const titleStyle = {
  color: '#0f172a',
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: '1.3',
  margin: '0 0 12px 0',
};

const description = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const cta = {
  backgroundColor: '#4b0082',
  borderRadius: '10px',
  color: '#ffffff',
  display: 'inline-block' as const,
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};

const outro = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '28px 0 0 0',
};
