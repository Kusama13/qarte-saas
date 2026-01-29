import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generateur QR Code Gratuit Sans Inscription | Menu avec Logo',
  description: 'Creez gratuitement un QR code design pour votre menu restaurant. Sans inscription. Ajoutez votre logo, personnalisez les couleurs. Telechargez en PNG haute qualite.',
  keywords: [
    'qr code gratuit',
    'qr code gratuit sans inscription',
    'qr code menu gratuit',
    'generateur qr code restaurant',
    'qr code menu design',
    'qr code avec logo',
    'menu digital restaurant',
    'qr code personnalise',
    'qr code menu pdf',
    'creer qr code menu',
  ],
  openGraph: {
    title: 'Generateur QR Code Gratuit Sans Inscription | Qarte',
    description: 'Creez un QR code design pour votre menu. Sans inscription, 100% gratuit. Logo et couleurs personnalisees.',
    type: 'website',
    url: 'https://getqarte.com/outils-gratuits/qr-menu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code Gratuit Sans Inscription',
    description: 'QR code design avec logo pour votre menu restaurant. Gratuit, sans compte.',
  },
  alternates: {
    canonical: 'https://getqarte.com/outils-gratuits/qr-menu',
  },
};

export default function QRMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
