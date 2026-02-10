import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs - Programme de fidélité dès 19€/mois',
  description: 'Tarifs transparents pour votre carte de fidélité digitale. Essai gratuit 30 jours, puis dès 19€/mois. Idéal pour coiffeurs, barbiers et instituts de beauté.',
  openGraph: {
    title: 'Tarifs - Programme de fidélité dès 19€/mois | Qarte',
    description: 'Tarifs transparents pour votre carte de fidélité digitale. Essai gratuit 30 jours, puis dès 19€/mois.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
