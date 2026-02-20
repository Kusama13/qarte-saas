import {
  HeroSection,
  TestimonialsSection,
  PricingSection,
  FooterSection,
  ScrollToTopButton,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import { LazyHowItWorksSection, LazyReferralSection, LazyAIReengagementSection, LazyFAQSection } from '@/components/landing/LazySections';

export default function LandingPageV4() {
  return (
    <>
      <ClientShell />

      <main className="overflow-hidden">
        <HeroSection />
        <LazyHowItWorksSection />
        <LazyReferralSection />
        <LazyAIReengagementSection />
        <TestimonialsSection />
        <PricingSection />
        <LazyFAQSection />
        <FooterSection />
      </main>


      <ScrollToTopButton />
    </>
  );
}
