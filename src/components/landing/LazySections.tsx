'use client';

import dynamic from 'next/dynamic';

const ReferralSection = dynamic(() => import('@/components/landing/ReferralSection').then(m => ({ default: m.ReferralSection })), { ssr: false });
const AIReengagementSection = dynamic(() => import('@/components/landing/AIReengagementSection').then(m => ({ default: m.AIReengagementSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });

export function LazyReferralSection() { return <ReferralSection />; }
export function LazyAIReengagementSection() { return <AIReengagementSection />; }
export function LazyFAQSection() { return <FAQSection />; }
