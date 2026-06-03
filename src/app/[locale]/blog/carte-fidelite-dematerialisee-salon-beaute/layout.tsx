import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';
  const path = 'blog/carte-fidelite-dematerialisee-salon-beaute';

  return {
    title: isFr
      ? 'Carte de fidélité dématérialisée pour salon de beauté : pourquoi passer au digital en 2026'
      : 'Digital loyalty card for beauty salons: why go digital in 2026',
    description: isFr
      ? 'Pourquoi les cartes de fidélité papier font perdre des passages, et ce que change une carte digitale sans appli : comparatif des outils, prix, parcours cliente en 3 étapes.'
      : 'Why paper loyalty cards lose visits, and what a no-app digital card changes: tool comparison, pricing, 3-step client journey.',
    keywords: isFr
      ? [
          'carte fidélité dématérialisée salon',
          'carte fidélité digitale coiffeur',
          'carte fidélité sans application',
          'programme fidélité institut beauté',
          'remplacer carte tampons papier',
        ]
      : [
          'digital loyalty card salon',
          'digital loyalty card hairdresser',
          'loyalty card without app',
          'beauty salon loyalty program',
          'replace paper stamp card',
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
        ? 'Carte de fidélité dématérialisée pour salon de beauté en 2026'
        : 'Digital loyalty card for beauty salons in 2026',
      description: isFr
        ? 'Une carte de fidélité digitale sans appli : comparatif des outils, prix, et parcours cliente en 3 étapes.'
        : 'A no-app digital loyalty card: tool comparison, pricing, and a 3-step client journey.',
      url: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      type: 'article',
      images: [
        {
          url: 'https://getqarte.com/blog/social/article-8-cover.png',
          width: 1080,
          height: 1080,
          alt: isFr
            ? 'Carte de fidélité digitale scannée sur smartphone en salon'
            : 'Digital loyalty card scanned on a smartphone in a salon',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
