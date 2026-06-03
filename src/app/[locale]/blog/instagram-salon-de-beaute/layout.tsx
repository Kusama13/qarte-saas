import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/blog/instagram-salon-de-beaute';
  const cover = `${baseUrl}/blog/social/article-11-cover.png`;

  if (locale === 'en') {
    return {
      title: 'Instagram for beauty salons: turn followers into clients',
      description:
        'Instagram for beauty salons: how to turn followers into real clients. 7 content ideas, the right bio link, and how to convert a like into a booking.',
      alternates: {
        canonical: `${baseUrl}/en${path}`,
        languages: { fr: `${baseUrl}${path}`, en: `${baseUrl}/en${path}` },
      },
      openGraph: {
        title: 'Instagram for beauty salons: turn followers into clients',
        description: 'How to turn your Instagram followers into real, returning clients.',
        type: 'article',
        locale: 'en_US',
        url: `${baseUrl}/en${path}`,
        images: [{ url: cover, width: 1080, height: 1080 }],
      },
    };
  }

  return {
    title: 'Instagram pour salon de beauté : transformer tes abonnées en clientes',
    description:
      'Instagram pour salon de beauté : la méthode pour transformer tes abonnées en vraies clientes. 7 idées de contenu, le bon lien en bio, et comment convertir un like en rendez-vous.',
    keywords: [
      'instagram salon de beauté',
      'instagram salon de coiffure',
      'instagram esthéticienne',
      'réseaux sociaux salon de beauté',
      'idées posts instagram coiffure',
      'gagner des clientes avec instagram',
      'lien en bio instagram salon',
    ],
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: { fr: `${baseUrl}${path}`, en: `${baseUrl}/en${path}` },
    },
    openGraph: {
      title: 'Instagram pour salon de beauté : transformer tes abonnées en clientes',
      description:
        'La méthode pour transformer tes abonnées Instagram en vraies clientes : contenu, lien en bio, réservation directe et fidélité automatique.',
      type: 'article',
      locale: 'fr_FR',
      url: `${baseUrl}${path}`,
      images: [{ url: cover, width: 1080, height: 1080 }],
    },
  };
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
