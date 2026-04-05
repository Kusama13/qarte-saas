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
        <PricingSection />
        <LazyFAQSection />
        <FooterSection />
      </main>

      <ScrollToTopButton />
    </>
  );
}
