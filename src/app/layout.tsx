import type { Metadata, Viewport } from 'next';
import { Figtree, Bodoni_Moda } from 'next/font/google';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });
const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-display' });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

// EN is 301-redirected to FR (middleware.ts) — metadata is FR-only.
// Short title (<60 chars) for SERP display. Description <160 chars for full snippet.
const TITLE = 'Qarte — Réservation & fidélité pour salons de beauté';
const DESCRIPTION = "Qarte — l'app tout-en-un des salons de beauté : carte de fidélité digitale, réservation en ligne sans commission, page salon. Essai 7 jours.";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#4b0082',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: TITLE,
    template: '%s | Qarte',
  },
  description: DESCRIPTION,
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
    title: TITLE,
    description: DESCRIPTION,
    url: baseUrl,
    siteName: 'Qarte',
    type: 'website',
    locale: 'fr_FR',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      fr: baseUrl,
      'x-default': baseUrl,
    },
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
  const t = await getTranslations({ locale, namespace: 'testimonials' });

  const reviews = [1, 2, 3, 4].map((i) => ({
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: t(`t${i}Rating`),
      bestRating: '5',
    },
    author: { '@type': 'Person', name: t(`t${i}Name`) },
    reviewBody: t(`t${i}Text`),
  }));

  const ratingValues = [1, 2, 3, 4].map((i) => parseFloat(t(`t${i}Rating`)));
  const avgRating = (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1);

  // Single @graph JSON-LD — Organization + WebSite + SoftwareApplication with aggregateRating + reviews
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Qarte',
        url: baseUrl,
        logo: `${baseUrl}/icon-512.png`,
        description: 'Plateforme tout-en-un pour les professionnels de la beauté : réservation en ligne, fidélité et vitrine SEO.',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          url: 'https://wa.me/33607447420',
          availableLanguage: ['French'],
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: '58 rue de Monceau, CS 48756',
          addressLocality: 'Paris',
          postalCode: '75380',
          addressCountry: 'FR',
        },
        sameAs: [
          'https://www.instagram.com/getqarte',
          'https://www.facebook.com/getqarte',
          'https://www.tiktok.com/@getqarte',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Qarte',
        publisher: { '@id': `${baseUrl}/#organization` },
        inLanguage: 'fr-FR',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#software`,
        name: 'Qarte',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: baseUrl,
        description: 'Réservation en ligne sans commission, programme de fidélité digital (tampons + cagnotte) et vitrine SEO pour salons de beauté.',
        offers: {
          '@type': 'Offer',
          price: '24',
          priceCurrency: 'EUR',
          priceValidUntil: '2026-12-31',
          url: `${baseUrl}/#pricing`,
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: avgRating,
          bestRating: '5',
          ratingCount: String(reviews.length),
          reviewCount: String(reviews.length),
        },
        review: reviews,
        publisher: { '@id': `${baseUrl}/#organization` },
        availableLanguage: ['French'],
      },
    ],
  };

  return (
    <html lang={locale} translate="no" className={`${figtree.variable} ${bodoni.variable} notranslate`}>
      <head>
        {/* Disable auto-translate (Google Translate sur Chrome Android cause crash React #310 sur mobile) */}
        <meta name="google" content="notranslate" />

        {/* PWA iOS standalone — évite tap delay 300ms + hit-test décalé + safe-area */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Qarte" />
        <meta name="format-detection" content="telephone=no" />

        {/* Defense-in-depth : patch Node.removeChild/insertBefore pour eviter crash React #310
            si une extension (Google Translate, 1Password, Grammarly, ad blockers, iOS content
            blockers) modifie le DOM sous React. Si on ne patch pas, React crash en commit phase,
            l'URL change via router.push mais le DOM reste fige → user stuck visually. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof Node!=='function'||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(!c||c.parentNode===this)return r.call(this,c);try{console.warn('[qarte] removeChild: wrong parent, silent skip')}catch(e){}return c};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,b){if(!b||b.parentNode===this)return i.call(this,n,b);try{console.warn('[qarte] insertBefore: wrong parent, appending')}catch(e){}return i.call(this,n,null)}})();`,
          }}
        />

        {/* Microsoft Clarity — loaded inline in <head> to track all pages from first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vjx7g9ttax");`,
          }}
        />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Hreflang — FR only (EN redirects to FR via middleware) */}
        <link rel="alternate" hrefLang="fr" href={baseUrl} />
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />

        {/* Structured data — single @graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
