import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return {
    title: isFr
      ? 'Lien Planity en bio Instagram : l\'erreur qui t\'envoie tes clientes chez la concurrente'
      : 'Planity link in Instagram bio: the mistake sending your clients to competitors',
    description: isFr
      ? 'Mettre ton lien Planity, Booksy ou Treatwell en bio Instagram, c\'est envoyer tes abonnées chez la concurrente. Voici pourquoi — et ce qu\'il faut mettre à la place.'
      : 'Putting your Planity, Booksy or Treatwell link in your Instagram bio sends your followers to competitors. Here is why — and what to put instead.',
    keywords: isFr
      ? [
          'lien Planity bio Instagram',
          'Booksy Instagram erreur',
          'lien bio Instagram salon beauté',
          'bio Instagram coiffeuse',
          'page réservation salon Instagram',
          'Treatwell Instagram',
        ]
      : [
          'Planity link Instagram bio',
          'beauty salon Instagram bio',
          'booking link Instagram salon',
        ],
    alternates: {
      canonical: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/ne-pas-mettre-lien-planity-bio-instagram`,
      languages: {
        fr: 'https://getqarte.com/blog/ne-pas-mettre-lien-planity-bio-instagram',
        en: 'https://getqarte.com/en/blog/ne-pas-mettre-lien-planity-bio-instagram',
      },
    },
    openGraph: {
      title: isFr
        ? 'Pourquoi ton lien Planity en bio Instagram envoie tes clientes chez la concurrente'
        : 'Why your Planity link in Instagram bio sends clients to competitors',
      description: isFr
        ? 'Tu travailles dur pour ton audience Instagram. Puis tu les envoies directement chez la concurrente avec ton lien Planity.'
        : 'You work hard for your Instagram audience. Then you send them straight to competitors with your Planity link.',
      url: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/ne-pas-mettre-lien-planity-bio-instagram`,
      type: 'article',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: isFr ? 'Téléphone avec profil Instagram pour salon de beauté' : 'Phone with Instagram profile for beauty salon',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
