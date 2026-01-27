import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/CookieBanner';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/analytics/GoogleTagManager';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Qarte - Digitalisez vos cartes de fidélité',
    template: '%s | Qarte',
  },
  description: 'La solution la moins chère du marché pour digitaliser vos cartes de fidélité. Démarrez gratuitement, sans carte bancaire.',
  keywords: ['carte de fidélité', 'fidélisation client', 'commerce', 'QR code', 'digital', 'programme fidélité'],
  authors: [{ name: 'Qarte' }],
  creator: 'Qarte',
  publisher: 'Qarte',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Qarte - Digitalisez vos cartes de fidélité',
    description: 'La solution la moins chère du marché pour digitaliser vos cartes de fidélité. Démarrez gratuitement, sans carte bancaire.',
    url: baseUrl,
    siteName: 'Qarte',
    type: 'website',
    locale: 'fr_FR',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qarte - Digitalisez vos cartes de fidélité',
    description: 'La solution la moins chère du marché pour digitaliser vos cartes de fidélité.',
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
    <html lang="fr" className={inter.variable}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <GoogleTagManager />
      </head>
      <body className="font-sans">
        <GoogleTagManagerNoscript />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
