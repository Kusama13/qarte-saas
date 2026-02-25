'use client';

import dynamic from 'next/dynamic';

const BentoFeaturesSection = dynamic(() => import('@/components/landing/BentoFeaturesSection').then(m => ({ default: m.BentoFeaturesSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });

export function LazyBentoFeaturesSection() { return <BentoFeaturesSection />; }
export function LazyFAQSection() { return <FAQSection />; }
