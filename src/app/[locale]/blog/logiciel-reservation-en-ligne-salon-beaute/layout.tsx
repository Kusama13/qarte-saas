import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return {
    title: isFr
      ? 'Logiciel de réservation en ligne pour salon de beauté : comparatif 2026'
      : 'Online booking software for beauty salons: 2026 comparison',
    description: isFr
      ? 'Planity, Treatwell, Booksy, Qarte : comparatif détaillé des logiciels de réservation en ligne pour salon de coiffure, institut et onglerie. Tarifs, commissions, fonctionnalités.'
      : 'Planity, Treatwell, Booksy, Qarte: detailed comparison of online booking software for hair salons, beauty institutes and nail bars. Prices, commissions, features.',
    keywords: isFr
      ? [
          'logiciel réservation en ligne salon',
          'logiciel caisse salon coiffure',
          'comparatif logiciels salon beauté',
          'planity vs treatwell',
          'planity vs booksy',
          'alternative planity',
          'site de prise de rendez-vous salon',
        ]
      : [
          'online booking software salon',
          'salon software comparison',
          'planity vs treatwell',
          'booking platform beauty',
        ],
    alternates: {
      canonical: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/logiciel-reservation-en-ligne-salon-beaute`,
      languages: {
        fr: 'https://getqarte.com/blog/logiciel-reservation-en-ligne-salon-beaute',
        en: 'https://getqarte.com/en/blog/logiciel-reservation-en-ligne-salon-beaute',
      },
    },
    openGraph: {
      title: isFr
        ? 'Logiciel de réservation en ligne salon de beauté : comparatif 2026'
        : 'Online booking software for beauty salons: 2026 comparison',
      description: isFr
        ? 'Comparatif Planity, Treatwell, Booksy, Qarte : tarifs, commissions, fonctionnalités, pour quel type de salon.'
        : 'Comparison Planity, Treatwell, Booksy, Qarte: pricing, commissions, features.',
      url: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/logiciel-reservation-en-ligne-salon-beaute`,
      type: 'article',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: isFr ? 'Logiciel de réservation en ligne pour salon' : 'Online booking software for salons',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
