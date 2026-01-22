import { Header, Footer } from '@/components/shared';
import {
  HeroSection,
  ProblemSection,
  HowItWorks,
  FeaturesSection,
  IndustriesSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTABanner,
  FloatingButton,
} from '@/components/landing';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorks />
        <FeaturesSection />
        <IndustriesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTABanner />
      </main>
      <Footer />
      <FloatingButton />
    </>
  );
}
