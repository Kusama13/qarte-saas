import dynamic from 'next/dynamic';
import {
  HeroSection,
  TestimonialsSection,
  PricingSection,
  FooterSection,
  ScrollToTopButton,
  MobileStickyCta,
} from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';

// Lazy load below-fold sections that use framer-motion (saves ~30KB from initial bundle)
const ReferralSection = dynamic(() => import('@/components/landing/ReferralSection').then(m => ({ default: m.ReferralSection })), { ssr: false });
const AIReengagementSection = dynamic(() => import('@/components/landing/AIReengagementSection').then(m => ({ default: m.AIReengagementSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });

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
