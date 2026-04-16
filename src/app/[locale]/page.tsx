import {
  HeroSection,
  SocialProofSection,
  FeaturesGridSection,
  PageProSection,
  TestimonialsSection,
  PricingSection,
  FooterSection,
  ScrollToTopButton,
  MobileStickyCta,
  CaseStudySection,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import { LazyFideliteSection, LazyFAQSection } from '@/components/landing/LazySections';

// JSON-LD (Organization, WebSite, SoftwareApplication with AggregateRating + Reviews)
// is emitted from the root layout (src/app/layout.tsx) as a single @graph.

export default function LandingPageV4() {
  return (
    <>
      <ClientShell />

      <main className="overflow-hidden">
        <HeroSection />
        <SocialProofSection />
        <FeaturesGridSection />
        <LazyFideliteSection />
        <PageProSection />
        <TestimonialsSection />
        <CaseStudySection />
        <PricingSection />
        <LazyFAQSection />
        <FooterSection />
      </main>

      <MobileStickyCta />
      <ScrollToTopButton />
    </>
  );
}
