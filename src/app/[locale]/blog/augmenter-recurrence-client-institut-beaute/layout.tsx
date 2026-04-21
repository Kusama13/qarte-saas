import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
const slug = 'augmenter-recurrence-client-institut-beaute';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  if (locale === 'en') {
    return {
      title: 'How to increase client visit frequency in a beauty salon',
      description:
        'Discover 5 actionable strategies to increase visit frequency in your beauty salon. Loyalty programs, subscriptions, communication: go from 4 to 10 visits per year.',
      openGraph: {
        title: 'How to increase client visit frequency in a beauty salon',
        description:
          '5 actionable strategies to double visit frequency in your beauty salon. From loyalty programs to referrals, the complete guide.',
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
    title: 'Comment augmenter la récurrence client en institut de beauté',
    description:
      'Découvrez 5 stratégies concrètes pour augmenter la fréquence de visite de vos clientes en institut de beauté. Programme fidélité, abonnements, communication : passez de 4 à 10 visites par an.',
    keywords: [
      'récurrence client institut beauté',
      'fidéliser clientes institut',
      'augmenter fréquence visites institut',
      'fidélisation institut de beauté',
      'programme fidélité institut beauté',
      'faire revenir clientes institut',
      'récurrence salon esthétique',
      'fréquence visite institut beauté',
    ],
    openGraph: {
      title: 'Comment augmenter la récurrence client en institut de beauté',
      description:
        '5 stratégies concrètes pour doubler la fréquence de visite en institut de beauté. Du programme fidélité au parrainage, le guide complet.',
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
