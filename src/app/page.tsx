'use client';

import { memo } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { LandingAnalytics } from '@/components/analytics/LandingAnalytics';
import { FacebookPixel, FacebookScrollTracker } from '@/components/analytics/FacebookPixel';
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

// Memoized sections for better performance
const MemoizedHeroSection = memo(HeroSection);
const MemoizedTestimonialsSection = memo(TestimonialsSection);
const MemoizedReferralSection = memo(ReferralSection);
const MemoizedAIReengagementSection = memo(AIReengagementSection);
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
        <MemoizedReferralSection />
        <MemoizedAIReengagementSection />
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
