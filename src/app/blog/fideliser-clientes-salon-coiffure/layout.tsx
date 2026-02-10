import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comment fidéliser ses clientes en salon de coiffure : le guide complet',
  description:
    'Découvrez les 7 stratégies concrètes pour fidéliser vos clientes en salon de coiffure. Programme de fidélité, rappels automatiques, expérience client : tout ce qui fonctionne en 2025.',
  keywords: [
    'fidéliser clientes salon coiffure',
    'programme fidélité coiffeur',
    'fidélisation salon de coiffure',
    'carte fidélité coiffure',
    'retenir clientes coiffeur',
    'programme fidélité salon beauté',
    'fidélisation clientèle coiffure',
  ],
  openGraph: {
    title: 'Comment fidéliser ses clientes en salon de coiffure : le guide complet',
    description:
      'Les 7 stratégies qui fonctionnent vraiment pour faire revenir vos clientes. Du programme de fidélité aux petites attentions, le guide complet.',
    type: 'article',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://getqarte.com/blog/fideliser-clientes-salon-coiffure',
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
