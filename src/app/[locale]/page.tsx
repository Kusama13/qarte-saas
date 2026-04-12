import {
  HeroSection,
  SocialProofSection,
  FeaturesGridSection,
  PageProSection,
  TestimonialsSection,
  PricingSection,
  FooterSection,
  ScrollToTopButton,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import { LazyFideliteSection, LazyFAQSection } from '@/components/landing/LazySections';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Qarte',
  url: 'https://getqarte.com',
  logo: 'https://getqarte.com/icons/icon-512x512.png',
  description: 'Plateforme tout-en-un pour les pros de la beauté : réservation en ligne, fidélité et vitrine SEO.',
  sameAs: [
    'https://www.instagram.com/getqarte',
    'https://www.tiktok.com/@getqarte',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    url: 'https://wa.me/33607447420',
    availableLanguage: 'French',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '60 rue François 1er',
    addressLocality: 'Paris',
    postalCode: '75008',
    addressCountry: 'FR',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Qarte',
  url: 'https://getqarte.com',
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Qarte',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://getqarte.com',
  offers: {
    '@type': 'Offer',
    price: '24',
    priceCurrency: 'EUR',
    priceValidUntil: '2027-12-31',
    url: 'https://getqarte.com/#pricing',
  },
  description: 'Réservation en ligne, programme de fidélité et vitrine SEO pour les salons de beauté.',
};

export default function LandingPageV4() {
  return (
    <>
      <ClientShell />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd, softwareJsonLd]) }}
      />

      <main className="overflow-hidden">
        <HeroSection />
        <SocialProofSection />
        <FeaturesGridSection />
        <LazyFideliteSection />
        <PageProSection />
        <TestimonialsSection />
        <PricingSection />
        <LazyFAQSection />
        <FooterSection />
      </main>

      <ScrollToTopButton />
    </>
  );
}
