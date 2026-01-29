import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generateur QR Code Menu Gratuit | Design avec Logo',
  description: 'Creez gratuitement un QR code design pour votre menu restaurant. Ajoutez votre logo, personnalisez les couleurs. Telechargez en PNG haute qualite.',
  keywords: [
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
    title: 'Generateur QR Code Menu Gratuit | Qarte',
    description: 'Creez un QR code design pour votre menu avec logo et couleurs personnalisees. 100% gratuit.',
    type: 'website',
    url: 'https://getqarte.com/outils-gratuits/qr-menu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generateur QR Code Menu Gratuit',
    description: 'QR code design avec logo pour votre menu restaurant. Gratuit.',
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
