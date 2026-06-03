import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';
  const path = 'blog/augmenter-chiffre-affaires-salon-beaute';

  return {
    title: isFr
      ? 'Augmenter le chiffre d\'affaires de son salon de beauté : 7 idées qui marchent vraiment'
      : 'Growing your beauty salon revenue: 7 ideas that actually work',
    description: isFr
      ? '7 leviers concrets pour augmenter le CA de ton salon en 2026 : fidélisation, anti no-show, bons cadeaux, panier moyen, réservation en ligne. Chiffres et plan d\'action.'
      : '7 concrete levers to grow your salon revenue in 2026: loyalty, no-show prevention, gift cards, average ticket, online booking. Numbers and an action plan.',
    keywords: isFr
      ? [
          'augmenter chiffre affaires salon',
          'augmenter ca salon de coiffure',
          'rentabilité salon de beauté',
          'augmenter panier moyen salon',
          'développer son institut de beauté',
        ]
      : [
          'grow beauty salon revenue',
          'increase salon sales',
          'salon profitability',
          'increase average ticket salon',
          'grow beauty business',
        ],
    alternates: {
      canonical: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      languages: {
        fr: `https://getqarte.com/${path}`,
        en: `https://getqarte.com/en/${path}`,
      },
    },
    openGraph: {
      title: isFr
        ? 'Augmenter le chiffre d\'affaires de son salon de beauté : 7 leviers'
        : 'Growing your beauty salon revenue: 7 levers',
      description: isFr
        ? '7 idées concrètes pour augmenter ton CA : fidélisation, anti no-show, bons cadeaux, panier moyen, réservation en ligne.'
        : '7 concrete ideas to grow your revenue: loyalty, no-show prevention, gift cards, average ticket, online booking.',
      url: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      type: 'article',
      images: [
        {
          url: 'https://getqarte.com/blog/social/article-9-cover.png',
          width: 1080,
          height: 1080,
          alt: isFr ? 'Salon de beauté en croissance' : 'Growing beauty salon',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
