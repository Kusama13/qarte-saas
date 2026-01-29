import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code WiFi Gratuit Sans Inscription | Generateur',
  description: 'Generez gratuitement un QR code WiFi pour votre etablissement. Sans inscription. Vos clients se connectent en un scan, fini de dicter le mot de passe !',
  keywords: [
    'qr code wifi gratuit',
    'qr code wifi sans inscription',
    'generateur qr code wifi',
    'qr code wifi restaurant',
    'qr code wifi commerce',
    'wifi qr code generator',
    'creer qr code wifi',
    'qr code connexion wifi',
    'wifi gratuit qr code',
    'partager wifi qr code',
  ],
  openGraph: {
    title: 'QR Code WiFi Gratuit Sans Inscription | Qarte',
    description: 'Generez un QR code WiFi pour votre etablissement. Sans inscription, 100% gratuit. Vos clients se connectent en un scan !',
    type: 'website',
    url: 'https://getqarte.com/outils-gratuits/qr-wifi',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code WiFi Gratuit Sans Inscription',
    description: 'QR code WiFi pour votre commerce. Gratuit, sans compte.',
  },
  alternates: {
    canonical: 'https://getqarte.com/outils-gratuits/qr-wifi',
  },
};

export default function QRWifiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
