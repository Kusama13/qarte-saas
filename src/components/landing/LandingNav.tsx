'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import LocaleSwitcher from '@/components/shared/LocaleSwitcher';

interface LandingNavProps {
  /** Hide Tarifs, Contact, S'identifier links — keep only logo + CTA */
  minimal?: boolean;
}

export default function LandingNav({ minimal = false }: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('nav');

  return (
    <>
      {/* Sticky Top Banner - Customer Card Recovery */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500 hidden sm:inline">{t('bannerHasCard')}</span>
          <span className="text-gray-500 sm:hidden">{t('bannerHasCardMobile')}</span>
          <Link
            href="/customer/cards"
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            {t('bannerFindCard')}
          </Link>
        </div>
      </div>

      {/* Fixed Navbar - Light */}
      <nav className="fixed top-[36px] left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Qarte
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <LocaleSwitcher variant="light" />
            {!minimal && (
              <>
                <Link href="/#pricing" className="hover:text-indigo-600 transition-colors link-underline">{t('pricing')}</Link>
                <Link href="/contact" className="hover:text-indigo-600 transition-colors link-underline">{t('contact')}</Link>
                <Link href="/auth/merchant" className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold border border-indigo-200 rounded-lg transition-colors">{t('login')}</Link>
              </>
            )}
            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('header_desktop_cta', 'navbar'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
            >
              {t('freeTrial')}
            </Link>
          </div>

          {/* Mobile CTA + Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <LocaleSwitcher variant="light" />
            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('header_mobile_cta', 'navbar'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              {t('freeTrial')}
            </Link>
            {!minimal && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {!minimal && (
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
              >
                <div className="px-6 py-4 space-y-3">
                  <Link
                    href="/#pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                  >
                    {t('pricing')}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                  >
                    {t('contact')}
                  </Link>
                  <Link
                    href="/auth/merchant"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-3 mt-2 text-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-lg transition-all shadow-sm"
                  >
                    {t('proSpace')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </nav>
    </>
  );
}
