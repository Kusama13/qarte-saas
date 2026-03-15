'use client';

import dynamic from 'next/dynamic';

const FideliteSection = dynamic(() => import('@/components/landing/FideliteSection').then(m => ({ default: m.FideliteSection })), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false });

export function LazyFideliteSection() { return <FideliteSection />; }
export function LazyFAQSection() { return <FAQSection />; }
