import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Blog Qarte',
    default: 'Blog — Conseils fidélisation pour salons de beauté | Qarte',
  },
  description:
    'Conseils, guides et astuces pour fidéliser vos clientes en salon de coiffure, onglerie et institut de beauté. Par Qarte, la carte de fidélité digitale.',
  keywords: [
    'fidélisation salon beauté',
    'carte fidélité coiffeur',
    'programme fidélité onglerie',
    'fidélisation institut beauté',
    'carte fidélité digitale',
    'blog salon de coiffure',
  ],
  openGraph: {
    title: 'Blog Qarte — Conseils fidélisation beauté',
    description:
      'Guides pratiques pour fidéliser vos clientes en salon de beauté.',
    type: 'website',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://getqarte.com/blog',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
