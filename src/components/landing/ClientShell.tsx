'use client';

import { LandingAnalytics } from '@/components/analytics/LandingAnalytics';
import { FacebookPixel, FacebookScrollTracker } from '@/components/analytics/FacebookPixel';

export default function ClientShell() {
  return (
    <>
      <LandingAnalytics />
      <FacebookPixel />
      <FacebookScrollTracker />
    </>
  );
}
