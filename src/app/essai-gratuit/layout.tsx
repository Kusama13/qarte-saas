import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Essai gratuit 30 jours - Carte de fidélité digitale',
  description: 'Créez votre programme de fidélité digital en 5 minutes. 30 jours d\'essai gratuit, sans carte bancaire. Pour coiffeurs, barbiers, instituts de beauté et ongleries.',
  openGraph: {
    title: 'Essai gratuit 30 jours - Carte de fidélité digitale | Qarte',
    description: 'Créez votre programme de fidélité digital en 5 minutes. 30 jours d\'essai gratuit, sans carte bancaire.',
  },
};

export default function EssaiGratuitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
