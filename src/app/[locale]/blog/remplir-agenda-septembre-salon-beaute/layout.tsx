import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';
  const path = 'blog/remplir-agenda-septembre-salon-beaute';

  return {
    title: isFr
      ? 'Rentrée de septembre : remplir l\'agenda de ton salon (2026)'
      : 'September rush: fill your salon calendar early (2026)',
    description: isFr
      ? 'En août c\'est calme, mais septembre est le mois où tes clientes reprennent leurs habitudes. Comment remplir ton agenda de rentrée dès maintenant : faire reprendre RDV avant les congés, garder ta réservation en ligne ouverte pendant l\'été, et réveiller les clientes qu\'on n\'a pas vues depuis le printemps.'
      : 'August is quiet, but September is when your clients come back. How to fill your fall calendar now: rebook before the summer break, keep online booking open while you are away, and win back clients you have not seen since spring.',
    keywords: isFr
      ? [
          'remplir agenda salon septembre',
          'rentrée salon de beauté',
          'reprise activité salon',
          'agenda vide été salon',
          'relancer clientes salon',
          'réservation en ligne salon congés',
        ]
      : [
          'fill salon calendar september',
          'salon fall rush',
          'reopen salon after summer',
          'win back salon clients',
          'online booking during holidays',
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
        ? 'Rentrée de septembre : remplir l\'agenda de ton salon dès l\'été'
        : 'September rush: fill your salon calendar early',
      description: isFr
        ? 'Fais reprendre les prochains RDV avant les congés, garde ta réservation en ligne ouverte pendant l\'été, et réveille les clientes disparues depuis le printemps. Une rentrée pleine, sans stress.'
        : 'Rebook before the summer break, keep online booking open while you are away, and win back clients gone since spring. A full fall calendar, no stress.',
      url: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      type: 'article',
      images: [
        {
          url: 'https://getqarte.com/blog/social/article-14-cover.png',
          width: 1080,
          height: 1080,
          alt: isFr
            ? 'Remplir l\'agenda de son salon pour la rentrée de septembre'
            : 'Fill your salon calendar for the September rush',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
