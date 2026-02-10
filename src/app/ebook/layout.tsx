import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide gratuit : fidéliser vos clients en salon de beauté',
  description: 'Téléchargez notre ebook gratuit : 5 stratégies pour fidéliser vos clients en salon de coiffure, institut de beauté ou onglerie. Conseils pratiques et exemples concrets.',
  openGraph: {
    title: 'Guide gratuit : fidéliser vos clients en salon de beauté | Qarte',
    description: 'Téléchargez notre ebook gratuit : 5 stratégies pour fidéliser vos clients en salon de coiffure, institut de beauté ou onglerie.',
  },
};

export default function EbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
