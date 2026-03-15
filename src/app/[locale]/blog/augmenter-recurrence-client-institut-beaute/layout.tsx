import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comment augmenter la récurrence client en institut de beauté',
  description:
    'Découvrez 5 stratégies concrètes pour augmenter la fréquence de visite de vos clientes en institut de beauté. Programme fidélité, abonnements, communication : passez de 4 à 10 visites par an.',
  keywords: [
    'récurrence client institut beauté',
    'fidéliser clientes institut',
    'augmenter fréquence visites institut',
    'fidélisation institut de beauté',
    'programme fidélité institut beauté',
    'faire revenir clientes institut',
    'récurrence salon esthétique',
    'fréquence visite institut beauté',
  ],
  openGraph: {
    title: 'Comment augmenter la récurrence client en institut de beauté',
    description:
      '5 stratégies concrètes pour doubler la fréquence de visite en institut de beauté. Du programme fidélité au parrainage, le guide complet.',
    type: 'article',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://getqarte.com/blog/augmenter-recurrence-client-institut-beaute',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
