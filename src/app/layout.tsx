import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/shared/CookieBanner';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Qarte - Carte de fidélité digitale pour salons de beauté',
    template: '%s | Qarte',
  },
  description: 'Programme de fidélité digital pour coiffeurs, barbiers, instituts de beauté et ongleries. La solution la moins chère du marché. Essai gratuit, sans carte bancaire.',
  keywords: ['carte de fidélité', 'fidélisation client', 'programme fidélité', 'salon de coiffure', 'barbier', 'institut de beauté', 'onglerie', 'carte de fidélité coiffeur', 'QR code', 'digital'],
  authors: [{ name: 'Qarte' }],
  creator: 'Qarte',
  publisher: 'Qarte',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Qarte - Carte de fidélité digitale pour salons de beauté',
    description: 'Programme de fidélité digital pour coiffeurs, barbiers, instituts de beauté et ongleries. La solution la moins chère du marché. Essai gratuit, sans carte bancaire.',
    url: baseUrl,
    siteName: 'Qarte',
    type: 'website',
    locale: 'fr_FR',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qarte - Carte de fidélité digitale pour salons de beauté',
    description: 'Programme de fidélité digital pour coiffeurs, barbiers, instituts de beauté et ongleries. Essai gratuit, sans carte bancaire.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
