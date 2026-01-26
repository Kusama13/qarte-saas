'use client';

import { useEffect } from 'react';
import { useScrollTracking } from '@/hooks/useScrollTracking';
import { trackPageView } from '@/lib/analytics';

export function LandingAnalytics() {
  // Track scroll depth
  useScrollTracking();

  // Track page view on mount
  useEffect(() => {
    trackPageView('landing_page');
  }, []);

  return null;
}
