'use client';

import { LandingAnalytics } from '@/components/analytics/LandingAnalytics';
import { FacebookPixel, FacebookScrollTracker } from '@/components/analytics/FacebookPixel';
import { TikTokPixel, TikTokPageTracker } from '@/components/analytics/TikTokPixel';

export default function ClientShell() {
  return (
    <>
      <LandingAnalytics />
      <FacebookPixel />
      <FacebookScrollTracker />
      <TikTokPixel />
      <TikTokPageTracker />
    </>
  );
}
