import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte de fidelite digitale vs papier — Comparatif 2026 | Qarte',
  description:
    '73% des cartes papier sont perdues. Decouvrez pourquoi les salons de beaute passent a la carte de fidelite digitale Qarte : notifications push, anti-fraude, statistiques, zero impression. Essai gratuit 7 jours.',
  keywords: [
    'carte de fidelite digitale vs papier',
    'carte fidelite coiffeur',
    'programme fidelite salon beaute',
    'carte fidelite digitale',
    'qarte vs carte papier',
    'fidelisation client salon',
  ],
  openGraph: {
    title: 'Carte de fidelite digitale vs papier — Comparatif 2026',
    description:
      '73% des cartes papier sont perdues. Comparez carte papier et carte digitale Qarte pour votre salon de beaute.',
    type: 'article',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://getqarte.com/qarte-vs-carte-papier',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
