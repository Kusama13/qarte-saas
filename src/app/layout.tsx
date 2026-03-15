import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display, Poppins } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { MicrosoftClarity } from '@/components/analytics/MicrosoftClarity';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--font-poppins' });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Qarte — Le Linktree des pros de la beauté + programme de fidélité',
    template: '%s | Qarte',
  },
  description: 'Un seul lien pour tout montrer : bio, prestations, planning, photos, avis Google. Un programme de fidélité qui fait revenir vos clientes (tampons, cagnotte, relances auto). Pour coiffeurs, barbiers, instituts de beauté et ongleries. 19 €/mois, essai gratuit.',
  keywords: ['lien en bio salon de beauté', 'linktree coiffeur', 'mini-site salon de beauté', 'carte de fidélité digitale', 'programme fidélité coiffeur', 'fidélisation client beauté', 'QR code fidélité', 'vitrine en ligne coiffeur', 'salon de coiffure', 'barbier', 'onglerie', 'institut de beauté', 'avis Google salon', 'planning en ligne coiffeur'],
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
    title: 'Qarte — Le Linktree des pros de la beauté + programme de fidélité',
    description: 'Un seul lien pour tout montrer : bio, prestations, planning, photos. Un programme de fidélité qui fait revenir vos clientes. 19 €/mois, essai gratuit.',
    url: baseUrl,
    siteName: 'Qarte',
    type: 'website',
    locale: 'fr_FR',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qarte — Le Linktree des pros de la beauté + programme de fidélité',
    description: 'Un seul lien pour tout montrer + un programme de fidélité qui fait revenir vos clientes. Pour coiffeurs, barbiers, instituts et ongleries. Essai gratuit.',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${plusJakarta.variable} ${playfair.variable} ${poppins.variable}`}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Hreflang alternate links */}
        <link rel="alternate" hrefLang="fr" href={baseUrl} />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en`} />
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />

        {/* Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Qarte',
            url: baseUrl,
            logo: `${baseUrl}/icon-512.png`,
            description: 'Le Linktree des pros de la beauté : un seul lien pour tout montrer + un programme de fidélité digital. Pour coiffeurs, barbiers, ongleries et instituts.',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              url: 'https://wa.me/33607447420',
              availableLanguage: ['French', 'English'],
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
            description: 'Un seul lien pour tout montrer (bio, prestations, planning, photos) + programme de fidélité digital (QR code, tampons, cagnotte, notifications push). Sans application à télécharger.',
            offers: {
              '@type': 'Offer',
              price: '19',
              priceCurrency: 'EUR',
              priceValidUntil: '2026-12-31',
              url: `${baseUrl}/#pricing`,
              availability: 'https://schema.org/InStock',
            },
            availableLanguage: ['French', 'English'],
          }) }}
        />
      </head>
      <body className="font-sans">
        {children}
        <Analytics />
        <MicrosoftClarity />
      </body>
    </html>
  );
}
