import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs | Qarte - Programme de fidélité digital',
  description: 'Découvrez nos tarifs simples et transparents. 19€/mois pour digitaliser votre programme de fidélité. Essai gratuit de 14 jours sans engagement.',
  openGraph: {
    title: 'Tarifs | Qarte - Programme de fidélité digital',
    description: 'Découvrez nos tarifs simples et transparents. 19€/mois pour digitaliser votre programme de fidélité.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
