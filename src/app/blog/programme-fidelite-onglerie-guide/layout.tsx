import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Programme fidélité onglerie : le guide complet pour fidéliser vos clientes',
  description:
    'Remplissage, semi-permanent, gel... vos clientes reviennent toutes les 3 semaines. Découvrez comment créer un programme de fidélité rentable pour votre onglerie : quel type choisir, exemples concrets et mise en place pas à pas.',
  keywords: [
    'programme fidélité onglerie',
    'carte fidélité onglerie',
    'fidéliser clientes onglerie',
    'programme fidélité nail art',
    'carte fidélité prothésiste ongulaire',
    'fidélisation onglerie',
    'programme fidélité manucure',
    'fidéliser clientes nail salon',
  ],
  openGraph: {
    title: 'Programme fidélité onglerie : le guide complet pour fidéliser vos clientes',
    description:
      'Remplissage toutes les 3 semaines, semi-permanent tous les mois... Transformez cette récurrence naturelle en programme de fidélité rentable. Guide complet avec exemples concrets.',
    type: 'article',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://getqarte.com/blog/programme-fidelite-onglerie-guide',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
