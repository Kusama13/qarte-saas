import {
  HeroSection,
  TestimonialsSection,
  ReferralSection,
  AIReengagementSection,
  PricingSection,
  FAQSection,
  FooterSection,
  ScrollToTopButton,
  MobileStickyCta,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';

export default function LandingPageV4() {
  return (
    <>
      <ClientShell />

      <main className="overflow-hidden pb-24 md:pb-0">
        <HeroSection />
        <ReferralSection />
        <AIReengagementSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FooterSection />
      </main>

      <MobileStickyCta />
      <ScrollToTopButton />
    </>
  );
}
