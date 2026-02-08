'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function MobileStickyCta() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (approx 600px)
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <a
        href="/auth/merchant/signup"
        onClick={() => { trackCtaClick('mobile_sticky', 'mobile_sticky_cta'); fbEvents.initiateCheckout(); }}
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
      >
        Créer ma carte gratuite
        <ArrowRight className="w-5 h-5" />
      </a>
      <p className="text-center text-xs text-gray-500 mt-2">
        Essai 15 jours gratuit • Sans CB
      </p>
    </div>
  );
}
