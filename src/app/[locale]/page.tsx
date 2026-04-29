import {
  HeroSection,
  FeaturesGridSection,
  PageProSection,
  SocialProofMergedSection,
  PricingTransitionSection,
  PricingSectionCondensed,
  FooterSection,
  ScrollToTopButton,
  MobileStickyCta,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import { LazyFideliteSection, LazyFAQSection } from '@/components/landing/LazySections';
import { getTopMerchants } from '@/lib/get-top-merchants';

// JSON-LD (Organization, WebSite, SoftwareApplication with AggregateRating + Reviews)
// is emitted from the root layout (src/app/layout.tsx) as a single @graph.

export default async function LandingPageV4() {
  const topMerchants = await getTopMerchants();
  const heroLogos = topMerchants
    .filter(m => m.logo_url)
    .slice(0, 5)
    .map(m => ({ logo_url: m.logo_url!, shop_name: m.shop_name }));

  return (
    <>
      <ClientShell />

      <main className="overflow-hidden">
        <HeroSection topLogos={heroLogos} />
        <FeaturesGridSection />
        <PageProSection />
        <LazyFideliteSection />
        <SocialProofMergedSection />
        <PricingTransitionSection />
        <PricingSectionCondensed />
        <LazyFAQSection />
        <FooterSection />
      </main>

      <MobileStickyCta />
      <ScrollToTopButton />
    </>
  );
}
