import {
  HeroSection,
  SocialProofSection,
  LoyaltyModesSection,
  TestimonialsSection,
  PricingSection,
  FooterSection,
  ScrollToTopButton,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import { LazyBentoFeaturesSection, LazyFAQSection } from '@/components/landing/LazySections';

export default function LandingPageV4() {
  return (
    <>
      <ClientShell />

      <main className="overflow-hidden">
        <HeroSection />
        <SocialProofSection />
        <LoyaltyModesSection />
        <LazyBentoFeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <LazyFAQSection />
        <FooterSection />
      </main>


      <ScrollToTopButton />
    </>
  );
}
