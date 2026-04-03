'use client';

import { useEffect } from 'react';
import { LandingAnalytics } from '@/components/analytics/LandingAnalytics';
import { FacebookPixel, FacebookScrollTracker } from '@/components/analytics/FacebookPixel';
import { TikTokPixel, TikTokPageTracker } from '@/components/analytics/TikTokPixel';

export default function ClientShell() {
  // Capture ?ref= affiliate param from landing page URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('qarte_signup_source', `affiliate_${ref}`);
      }
    } catch { /* private browsing */ }
  }, []);

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
