import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return {
    title: isFr
      ? 'Comment attirer plus de clientes dans son salon de beauté : 12 stratégies qui marchent en 2026'
      : 'How to attract more clients to your beauty salon: 12 strategies that work in 2026',
    description: isFr
      ? 'Google Business, réservation en ligne, Instagram, parrainage, fidélité... Les 12 leviers concrets pour remplir ton agenda salon, institut, onglerie ou barbershop.'
      : 'Google Business, online booking, Instagram, referral, loyalty... 12 practical levers to fill your salon, institute, nail bar or barbershop calendar.',
    keywords: isFr
      ? [
          'attirer clients salon beauté',
          'comment avoir plus de clients coiffure',
          'remplir agenda salon',
          'acquisition salon beauté',
          'google business coiffeur',
          'instagram salon beauté',
        ]
      : [
          'attract clients beauty salon',
          'how to get more clients hair salon',
          'fill salon calendar',
          'beauty salon acquisition',
          'google business hair salon',
          'instagram beauty salon',
        ],
    alternates: {
      canonical: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/comment-attirer-clientes-salon-beaute`,
      languages: {
        fr: 'https://getqarte.com/blog/comment-attirer-clientes-salon-beaute',
        en: 'https://getqarte.com/en/blog/comment-attirer-clientes-salon-beaute',
      },
    },
    openGraph: {
      title: isFr
        ? 'Comment attirer plus de clientes dans son salon de beauté en 2026'
        : 'How to attract more clients to your beauty salon in 2026',
      description: isFr
        ? '12 stratégies concrètes pour remplir ton agenda : Google Business, réservation en ligne, Instagram, parrainage, fidélité et plus.'
        : '12 practical strategies to fill your calendar: Google Business, online booking, Instagram, referral, loyalty and more.',
      url: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/comment-attirer-clientes-salon-beaute`,
      type: 'article',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: isFr ? 'Salon de beauté moderne rempli de clientes' : 'Modern beauty salon full of clients',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
