import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
const canonical = `${baseUrl}/blog/service-domicile-salon-beaute-rayon-trajets`;

export const metadata: Metadata = {
  title: 'Service à domicile beauté : rayon, trajets et RDV mobiles',
  description:
    'Esthéticienne, prothésiste ongulaire ou coiffeuse à domicile : configure ton rayon (10-200 km), Qarte calcule tes trajets entre RDV et masque ton adresse perso. Inclus, sans option.',
  alternates: { canonical },
  openGraph: {
    title: 'Service à domicile beauté : rayon, trajets et RDV mobiles | Qarte',
    description:
      'Rayon configurable, calcul auto des trajets entre RDV, message hors-zone, adresse perso masquée : tout ce que Qarte fait pour les pros mobiles.',
    type: 'article',
    locale: 'fr_FR',
    url: canonical,
    images: [
      {
        url: `${baseUrl}/blog/social/article-7-cover.png`,
        width: 1080,
        height: 1080,
        alt: 'Service à domicile beauté · Qarte',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Service à domicile beauté : rayon, trajets et RDV mobiles',
    description:
      'Rayon configurable, trajets calculés tout seuls, adresse perso masquée. Pour les pros beauté mobiles.',
    images: [`${baseUrl}/blog/social/article-7-cover.png`],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
