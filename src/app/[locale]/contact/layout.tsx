import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  if (locale === 'en') {
    return {
      title: 'Contact — Questions about Qarte?',
      description: 'Need help with your salon page or loyalty program? Our team replies within 24h. Personalized support for your beauty salon.',
      openGraph: {
        title: 'Contact | Qarte',
        description: 'Need help with your salon page or loyalty program? Our team replies within 24h.',
      },
      alternates: {
        canonical: `${baseUrl}/en/contact`,
        languages: { fr: `${baseUrl}/contact`, en: `${baseUrl}/en/contact` },
      },
    };
  }

  return {
    title: 'Contact — Une question sur Qarte ?',
    description: 'Besoin d\'aide pour votre vitrine en ligne ou votre programme de fidélité ? Notre équipe vous répond sous 24h. Accompagnement personnalisé pour votre salon de beauté.',
    openGraph: {
      title: 'Contact | Qarte',
      description: 'Besoin d\'aide pour votre vitrine en ligne ou programme de fidélité ? Notre équipe vous répond sous 24h.',
    },
    alternates: {
      canonical: `${baseUrl}/contact`,
      languages: { fr: `${baseUrl}/contact`, en: `${baseUrl}/en/contact` },
    },
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
