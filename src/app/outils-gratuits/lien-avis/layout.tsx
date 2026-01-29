import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generateur Lien Avis Google Gratuit | Obtenez Plus d\'Avis',
  description: 'Generez gratuitement votre lien direct pour recevoir des avis Google. Partagez-le avec vos clients pour booster votre reputation en ligne.',
  keywords: [
    'lien avis google',
    'generateur lien avis',
    'demander avis google',
    'lien review google',
    'avis google restaurant',
    'obtenir avis google',
    'lien direct avis google',
    'google review link',
  ],
  openGraph: {
    title: 'Generateur Lien Avis Google Gratuit | Qarte',
    description: 'Obtenez votre lien direct pour recevoir des avis Google. Boostez votre reputation en ligne gratuitement.',
    type: 'website',
    url: 'https://getqarte.com/outils-gratuits/lien-avis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generateur Lien Avis Google Gratuit',
    description: 'Lien direct pour recevoir des avis Google. 100% gratuit.',
  },
  alternates: {
    canonical: 'https://getqarte.com/outils-gratuits/lien-avis',
  },
};

export default function LienAvisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
