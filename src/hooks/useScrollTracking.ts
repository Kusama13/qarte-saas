'use client';

import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '@/lib/analytics';

export function useScrollTracking() {
  const trackedDepths = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const scrollPercentage = Math.round((scrollPosition / scrollHeight) * 100);

      const milestones = [25, 50, 75, 100];

      for (const milestone of milestones) {
        if (scrollPercentage >= milestone && !trackedDepths.current.has(milestone)) {
          trackedDepths.current.add(milestone);
          trackScrollDepth(milestone);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}
