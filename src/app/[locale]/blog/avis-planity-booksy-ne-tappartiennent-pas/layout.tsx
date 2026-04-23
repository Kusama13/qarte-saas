import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return {
    title: isFr
      ? 'Tes avis sur Planity, Booksy et Treatwell ne t\'appartiennent pas — et c\'est dangereux'
      : 'Your reviews on Planity, Booksy and Treatwell don\'t belong to you — and it\'s dangerous',
    description: isFr
      ? 'Tes avis sur Planity ou Booksy disparaissent le jour où tu pars ou te fais déprioritiser. Seuls les avis Google t\'appartiennent vraiment. Voici comment les collecter automatiquement.'
      : 'Your reviews on Planity or Booksy disappear the day you leave or get deprioritized. Only Google reviews truly belong to you. Here is how to collect them automatically.',
    keywords: isFr
      ? [
          'avis Google salon beauté automatique',
          'avis Planity disparaissent',
          'réputation en ligne salon beauté',
          'avis Google coiffeur automatique',
          'Booksy avis perdus',
          'Treatwell réputation',
        ]
      : [
          'Google reviews beauty salon automatic',
          'Planity reviews disappear',
          'online reputation beauty salon',
        ],
    alternates: {
      canonical: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/avis-planity-booksy-ne-tappartiennent-pas`,
      languages: {
        fr: 'https://getqarte.com/blog/avis-planity-booksy-ne-tappartiennent-pas',
        en: 'https://getqarte.com/en/blog/avis-planity-booksy-ne-tappartiennent-pas',
      },
    },
    openGraph: {
      title: isFr
        ? 'Tes avis Planity et Booksy ne t\'appartiennent pas'
        : 'Your Planity and Booksy reviews don\'t belong to you',
      description: isFr
        ? '47 avis 5 étoiles sur Planity. Le jour où tu pars — ils disparaissent. Seuls les avis Google restent à toi pour toujours.'
        : '47 five-star reviews on Planity. The day you leave — they disappear. Only Google reviews stay yours forever.',
      url: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/avis-planity-booksy-ne-tappartiennent-pas`,
      type: 'article',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: isFr ? 'Avis Google pour salon de beauté' : 'Google reviews for beauty salon',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
