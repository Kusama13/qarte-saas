import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return {
    title: isFr
      ? 'Planity, Booksy : pourquoi tes clientes ne reviennent jamais (et comment changer ça)'
      : 'Planity, Booksy: why your clients never come back (and how to fix it)',
    description: isFr
      ? 'Les clientes venues de Planity, Booksy ou Treatwell sont transactionnelles : elles réservent une fois et disparaissent. Voici la vraie source de clientes fidèles et comment les garder.'
      : 'Clients from Planity, Booksy or Treatwell are transactional: they book once and disappear. Here is the real source of loyal clients and how to keep them.',
    keywords: isFr
      ? [
          'clients Planity fidélisation',
          'alternative Planity salon beauté',
          'fidéliser clients beauté',
          'Booksy fidélisation',
          'Treatwell clients fidèles',
          'programme fidélité salon',
        ]
      : [
          'Planity alternative beauty salon',
          'loyal clients beauty salon',
          'Booksy client retention',
          'beauty salon loyalty program',
        ],
    alternates: {
      canonical: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/clients-planity-booksy-ne-reviennent-jamais`,
      languages: {
        fr: 'https://getqarte.com/blog/clients-planity-booksy-ne-reviennent-jamais',
        en: 'https://getqarte.com/en/blog/clients-planity-booksy-ne-reviennent-jamais',
      },
    },
    openGraph: {
      title: isFr
        ? 'Planity, Booksy : ces clientes qui réservent et ne reviennent jamais'
        : 'Planity, Booksy: clients who book and never come back',
      description: isFr
        ? 'Ces clientes ne te cherchaient pas, elles cherchaient un créneau. Voici comment construire une vraie base de clientes fidèles.'
        : 'These clients were not looking for you, they were looking for a slot. Here is how to build a real loyal client base.',
      url: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/clients-planity-booksy-ne-reviennent-jamais`,
      type: 'article',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: isFr ? 'Salon de beauté avec programme de fidélité' : 'Beauty salon with loyalty program',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
