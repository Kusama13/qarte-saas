import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lien Avis Google Gratuit Sans Inscription | Generateur',
  description: 'Generez gratuitement votre lien direct avis Google. Sans inscription. Partagez-le avec vos clients pour obtenir plus d\'avis 5 etoiles.',
  keywords: [
    'lien avis google gratuit',
    'lien avis google sans inscription',
    'generateur lien avis google',
    'lien avis google',
    'demander avis google',
    'lien review google',
    'avis google restaurant',
    'obtenir avis google',
    'lien direct avis google',
    'google review link',
    'comment avoir plus d\'avis google',
    'augmenter avis google',
  ],
  openGraph: {
    title: 'Lien Avis Google Gratuit Sans Inscription | Qarte',
    description: 'Generez votre lien direct avis Google. Sans inscription, 100% gratuit. Obtenez plus d\'avis 5 etoiles.',
    type: 'website',
    url: 'https://getqarte.com/outils-gratuits/lien-avis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lien Avis Google Gratuit Sans Inscription',
    description: 'Lien direct pour recevoir des avis Google. Gratuit, sans compte.',
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
