import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display, Poppins } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800', '900'], variable: '--font-poppins' });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  const isEn = locale === 'en';

  const title = isEn
    ? 'Qarte — Online booking, loyalty & salon page for beauty pros'
    : 'Qarte — Réservation en ligne, fidélité et vitrine pour salons de beauté';

  const description = isEn
    ? 'Online booking with 0% commission, digital loyalty program and SEO salon page. Each client who books gets their loyalty card automatically. Free trial.'
    : 'Réservation en ligne 0% commission, programme de fidélité et vitrine SEO pour salons de beauté. Chaque cliente qui réserve reçoit sa carte de fidélité. Essai gratuit.';

  const ogDescription = isEn
    ? 'Online booking with 0% commission, digital loyalty program and SEO salon page. Each client who books gets their loyalty card automatically. Free trial.'
    : 'Réservation en ligne 0% commission, programme de fidélité et vitrine SEO pour salons de beauté. Chaque cliente qui réserve reçoit sa carte de fidélité. Essai gratuit.';

  const twitterDescription = isEn
    ? 'Online booking with 0% commission, digital loyalty program and SEO salon page. Each client who books gets their loyalty card automatically. Free trial.'
    : 'Réservation en ligne 0% commission, programme de fidélité et vitrine SEO pour salons de beauté. Chaque cliente qui réserve reçoit sa carte de fidélité. Essai gratuit.';

  const keywords = isEn
    ? ['online booking beauty salon', 'beauty salon booking system', 'digital loyalty card', 'loyalty program hair salon', 'beauty client retention', 'QR code loyalty', 'salon page', 'hair salon', 'barber', 'nail studio', 'beauty salon', 'Google reviews salon', 'online scheduling hair salon', 'commission free booking']
    : ['réservation en ligne salon de beauté', 'planning en ligne coiffeur', 'carte de fidélité digitale', 'programme fidélité coiffeur', 'fidélisation client beauté', 'QR code fidélité', 'vitrine en ligne coiffeur', 'salon de coiffure', 'barbier', 'onglerie', 'institut de beauté', 'avis Google salon', 'réservation sans commission', 'lien en bio salon de beauté'];

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
    <html lang={locale} translate="no" className={`${plusJakarta.variable} ${playfair.variable} ${poppins.variable} notranslate`}>
      <head>
        {/* Disable auto-translate (Google Translate sur Chrome Android cause crash React #310 sur mobile) */}
        <meta name="google" content="notranslate" />

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
                price: '24',
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
      </body>
    </html>
  );
}
