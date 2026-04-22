'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { Link } from '@/i18n/navigation';

export function MobileStickyCta() {
  const t = useTranslations('mobileCta');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <Link
        href="/auth/merchant/signup"
        onClick={() => { trackCtaClick('mobile_sticky', 'mobile_sticky_cta'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
      >
        {t('text')}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
