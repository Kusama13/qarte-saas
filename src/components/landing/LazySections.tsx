'use client';

import dynamic from 'next/dynamic';

const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })), { ssr: false });
const ReferralSection = dynamic(() => import('@/components/landing/ReferralSection').then(m => ({ default: m.ReferralSection })), { ssr: false });
const AIReengagementSection = dynamic(() => import('@/components/landing/AIReengagementSection').then(m => ({ default: m.AIReengagementSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });

export function LazyHowItWorksSection() { return <HowItWorksSection />; }
export function LazyReferralSection() { return <ReferralSection />; }
export function LazyAIReengagementSection() { return <AIReengagementSection />; }
export function LazyFAQSection() { return <FAQSection />; }
