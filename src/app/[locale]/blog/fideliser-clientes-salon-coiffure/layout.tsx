import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
const slug = 'fideliser-clientes-salon-coiffure';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  if (locale === 'en') {
    return {
      title: 'How to retain clients in a hair salon: the complete guide',
      description:
        'Discover 7 actionable strategies to retain clients in your hair salon. Loyalty programs, automatic reminders, client experience: everything that works in 2025.',
      openGraph: {
        title: 'How to retain clients in a hair salon: the complete guide',
        description:
          '7 strategies that actually work to keep your clients coming back. From loyalty programs to small touches, the complete guide.',
        type: 'article',
        locale: 'en_US',
      },
      alternates: {
        canonical: `${baseUrl}/en/blog/${slug}`,
        languages: { fr: `${baseUrl}/blog/${slug}`, en: `${baseUrl}/en/blog/${slug}` },
      },
    };
  }

  return {
    title: 'Comment fidéliser ses clientes en salon de coiffure : le guide complet',
    description:
      'Découvrez les 7 stratégies concrètes pour fidéliser vos clientes en salon de coiffure. Programme de fidélité, rappels automatiques, expérience client : tout ce qui fonctionne en 2025.',
    keywords: [
      'fidéliser clientes salon coiffure',
      'programme fidélité coiffeur',
      'fidélisation salon de coiffure',
      'carte fidélité coiffure',
      'retenir clientes coiffeur',
      'programme fidélité salon beauté',
      'fidélisation clientèle coiffure',
    ],
    openGraph: {
      title: 'Comment fidéliser ses clientes en salon de coiffure : le guide complet',
      description:
        'Les 7 stratégies qui fonctionnent vraiment pour faire revenir vos clientes. Du programme de fidélité aux petites attentions, le guide complet.',
      type: 'article',
      locale: 'fr_FR',
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
      languages: { fr: `${baseUrl}/blog/${slug}`, en: `${baseUrl}/en/blog/${slug}` },
    },
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
