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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  const isEn = locale === 'en';

  const title = isEn
    ? 'Qarte — Salon page & loyalty for beauty pros'
    : 'Qarte — Vitrine digitale et fidélité pour salons de beauté';

  const description = isEn
    ? 'Create your salon page in 5 min: services, photos, schedule, Google reviews. Built-in loyalty program. For hair salons, barbers and nail studios. Free trial.'
    : 'Créez votre vitrine en ligne en 5 min : prestations, photos, planning, avis Google. Programme de fidélité intégré. Essai gratuit.';

  const ogDescription = isEn
    ? 'Create your salon page in 5 min: services, photos, schedule, Google reviews. Built-in loyalty program. Free trial.'
    : 'Créez votre vitrine en ligne en 5 min : prestations, photos, planning, avis Google. Programme de fidélité intégré. Essai gratuit.';

  const twitterDescription = isEn
    ? 'Create your salon page in 5 min: services, photos, schedule, Google reviews. Built-in loyalty program. Free trial.'
    : 'Créez votre vitrine en ligne en 5 min : prestations, photos, planning, avis Google. Programme de fidélité intégré. Essai gratuit.';

  const keywords = isEn
    ? ['beauty salon bio link', 'linktree for hair salons', 'beauty salon mini-site', 'digital loyalty card', 'loyalty program hair salon', 'beauty client retention', 'QR code loyalty', 'online showcase hair salon', 'hair salon', 'barber', 'nail studio', 'beauty salon', 'Google reviews salon', 'online scheduling hair salon']
    : ['lien en bio salon de beauté', 'linktree coiffeur', 'mini-site salon de beauté', 'carte de fidélité digitale', 'programme fidélité coiffeur', 'fidélisation client beauté', 'QR code fidélité', 'vitrine en ligne coiffeur', 'salon de coiffure', 'barbier', 'onglerie', 'institut de beauté', 'avis Google salon', 'planning en ligne coiffeur'];

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: '%s | Qarte',
    },
    description,
    keywords,
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
      title,
      description: ogDescription,
      url: baseUrl,
      siteName: 'Qarte',
      type: 'website',
      locale: isEn ? 'en_US' : 'fr_FR',
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: twitterDescription,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  const orgDescription = locale === 'en'
    ? 'Salon page and loyalty program for beauty pros. Services, photos, schedule, Google reviews and client retention. For hair salons, barbers, nail studios and beauty salons.'
    : 'Vitrine digitale et programme de fidélité pour salons de beauté. Prestations, photos, planning, avis Google et fidélisation client. Pour coiffeurs, barbiers, ongleries et instituts.';

  const appDescription = locale === 'en'
    ? 'One link to showcase everything (bio, services, schedule, photos) + digital loyalty program (QR code, stamps, cashback, push notifications). No app to download.'
    : 'Un seul lien pour tout montrer (bio, prestations, planning, photos) + programme de fidélité digital (QR code, tampons, cagnotte, notifications push). Sans application à télécharger.';

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
            description: orgDescription,
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
            description: appDescription,
            offers: [
              {
                '@type': 'Offer',
                price: '19',
                priceCurrency: locale === 'en' ? 'USD' : 'EUR',
                priceValidUntil: '2026-12-31',
                url: `${baseUrl}/#pricing`,
                availability: 'https://schema.org/InStock',
              },
            ],
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
