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

const TESTIMONIAL_NAME_HINTS = ['yam nails', 'lux beauty', 'farida', 'ericka'];

export default async function LandingPageV4() {
  const topMerchants = await getTopMerchants();
  const heroLogos = topMerchants
    .filter(m => m.logo_url)
    .slice(0, 5)
    .map(m => ({ logo_url: m.logo_url!, shop_name: m.shop_name }));

  // Match testimonial names to real merchant logos when possible, fallback to next available
  const merchantsWithLogos = topMerchants.filter(m => m.logo_url);
  const usedUrls = new Set<string>();
  const testimonialLogos: string[] = [];
  for (const hint of TESTIMONIAL_NAME_HINTS) {
    const match = merchantsWithLogos.find(
      m => m.shop_name.toLowerCase().includes(hint) && !usedUrls.has(m.logo_url!)
    );
    const fallback = match || merchantsWithLogos.find(m => !usedUrls.has(m.logo_url!));
    if (fallback?.logo_url) {
      testimonialLogos.push(fallback.logo_url);
      usedUrls.add(fallback.logo_url);
    }
  }

  return (
    <>
      <ClientShell />

      <main className="overflow-hidden">
        <HeroSection topLogos={heroLogos} />
        <FeaturesGridSection />
        <LazyFideliteSection />
        <PageProSection />
        <SocialProofMergedSection testimonialLogos={testimonialLogos} />
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
