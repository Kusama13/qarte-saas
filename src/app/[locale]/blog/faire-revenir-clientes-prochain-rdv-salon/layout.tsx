import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';
  const path = 'blog/faire-revenir-clientes-prochain-rdv-salon';

  return {
    title: isFr
      ? 'Faire revenir ses clientes : reprendre le prochain RDV automatiquement (2026)'
      : 'Get clients to rebook: propose the next appointment automatically (2026)',
    description: isFr
      ? 'La cliente repart sans prochain RDV = un trou dans ton agenda. Comment proposer ses 2 prochains rendez-vous (+3 et +6 semaines) à la fin de la réservation en ligne, sans acompte tout de suite, pour remplir ton agenda sans relancer personne.'
      : 'A client who leaves without a next appointment is a gap in your calendar. How to propose her next 2 appointments (+3 and +6 weeks) at the end of online booking, with no deposit upfront, to fill your calendar without chasing anyone.',
    keywords: isFr
      ? [
          'faire revenir ses clientes salon',
          'fidéliser clientes coiffure',
          'reprendre rendez-vous salon',
          'remplir son agenda salon',
          'prochain rendez-vous automatique',
          'rebooking salon de beauté',
        ]
      : [
          'get salon clients to rebook',
          'client retention salon',
          'rebooking beauty salon',
          'fill salon calendar',
          'next appointment automatically',
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
        ? 'Faire revenir ses clientes : reprendre le prochain RDV automatiquement'
        : 'Get clients to rebook: propose the next appointment automatically',
      description: isFr
        ? 'Propose les 2 prochains RDV (+3 et +6 semaines) à la fin de la réservation en ligne, sans acompte tout de suite. Remplis ton agenda sans relancer personne.'
        : 'Propose the next 2 appointments (+3 and +6 weeks) at the end of online booking, with no deposit upfront. Fill your calendar without chasing anyone.',
      url: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      type: 'article',
      images: [
        {
          url: 'https://getqarte.com/blog/social/article-13-cover.png',
          width: 1080,
          height: 1080,
          alt: isFr
            ? 'Proposer les prochains rendez-vous automatiquement à la fin de la réservation en ligne'
            : 'Propose the next appointments automatically at the end of online booking',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
