'use client';

import { memo } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { LandingAnalytics } from '@/components/analytics/LandingAnalytics';
import { FacebookPixel, FacebookScrollTracker } from '@/components/analytics/FacebookPixel';
import {
  HeroSection,
  HowItWorksSection,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  FooterSection,
  ScrollToTopButton,
  MobileStickyCta,
} from '@/components/landing';

// Memoized sections for better performance
const MemoizedHeroSection = memo(HeroSection);
const MemoizedHowItWorksSection = memo(HowItWorksSection);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedTestimonialsSection = memo(TestimonialsSection);
const MemoizedPricingSection = memo(PricingSection);
const MemoizedFAQSection = memo(FAQSection);
const MemoizedFooterSection = memo(FooterSection);

export default function LandingPageV4() {
  return (
    <LazyMotion features={domAnimation}>
      <LandingAnalytics />
      <FacebookPixel />
      <FacebookScrollTracker />


      <main className="overflow-hidden pb-24 md:pb-0">
        <MemoizedHeroSection />
        <MemoizedFeaturesSection />
        <MemoizedHowItWorksSection />
        <MemoizedTestimonialsSection />
        <MemoizedPricingSection />
        <MemoizedFAQSection />
        <MemoizedFooterSection />
      </main>

      <MobileStickyCta />
      <ScrollToTopButton />
    </LazyMotion>
  );
}
