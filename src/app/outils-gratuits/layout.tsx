import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Outils Gratuits Qarte',
    default: 'Outils Gratuits pour Commercants',
  },
  description: 'Outils 100% gratuits pour restaurants, cafes et commerces. QR code menu design et lien avis Google.',
  keywords: [
    'outils gratuits commercants',
    'qr code menu gratuit',
    'lien avis google',
    'outils restaurant gratuit',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function OutilsGratuitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
