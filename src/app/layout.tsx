import type { Metadata } from 'next';
import { Noto_Sans, Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';
import CookieBanner from '@/components/shared/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { MicrosoftClarity } from '@/components/analytics/MicrosoftClarity';

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--font-poppins' });

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
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
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
    google: '2d98KO9ugpwse3o2e6RoYmVp1SAH9JaqokhbGbLjW3c',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${notoSans.variable} ${playfair.variable} ${poppins.variable}`}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Qarte',
            url: baseUrl,
            logo: `${baseUrl}/icon-512.png`,
            description: 'Programme de fidélité digital pour salons de beauté, coiffeurs, barbiers, ongleries et instituts.',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              url: 'https://wa.me/33607447420',
              availableLanguage: 'French',
            },
            sameAs: [
              'https://www.instagram.com/getqarte',
              'https://www.facebook.com/getqarte',
            ],
          }) }}
        />

        {/* Structured Data — SoftwareApplication (Product) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Qarte',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: baseUrl,
            description: 'Carte de fidélité digitale pour salons de beauté. QR code, notifications push, anti-fraude. Sans application à télécharger.',
            offers: {
              '@type': 'Offer',
              price: '19',
              priceCurrency: 'EUR',
              priceValidUntil: '2026-12-31',
              url: `${baseUrl}/#pricing`,
              availability: 'https://schema.org/InStock',
            },
          }) }}
        />
      </head>
      <body className="font-sans">
        {children}
        <CookieBanner />
        <Analytics />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
