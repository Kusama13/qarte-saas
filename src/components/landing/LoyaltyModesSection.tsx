'use client';

import { motion } from 'framer-motion';
import { Sparkles, Star, UserPlus, Search, Gift, Share2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── Card: SEO Google Local ── */
function SeoCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-200/50">
        <Search className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{t('seoTitle')}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        {t('seoDesc')}
      </p>

      {/* Mini mockup: Google result */}
      <div className="bg-gray-50 rounded-xl p-4 mt-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">G</span>
          </div>
          <span className="text-[10px] text-gray-400">getqarte.com/p/latelier</span>
        </div>
        <p className="text-sm font-semibold text-blue-700 mb-0.5">{t('seoMockupTitle')}</p>
        <p className="text-[11px] text-gray-500">{t('seoMockupDesc')}</p>
        <div className="flex items-center gap-1 mt-1.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">{t('seoMockupReviews')}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Card: Offre Nouveaux Clients ── */
function WelcomeOfferCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl border border-violet-100 shadow-xl shadow-violet-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-200/50">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{t('welcomeTitle')}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        {t('welcomeDesc')}
      </p>

      {/* Mini mockup: Offer card */}
      <div className="bg-white/80 rounded-xl p-4 mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{t('welcomeTitle')}</span>
        </div>
        <p className="text-sm font-bold text-gray-800 mb-3">{t('welcomeOffer')}</p>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg px-3 py-2 text-center">
          <span className="text-xs font-bold text-white">{t('welcomeCta')}</span>
        </div>
        <div className="flex items-center gap-2 mt-3 bg-emerald-50 rounded-lg px-3 py-2">
          <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700">{t('welcomeNewClient')}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Card: Avis Google ── */
function ReviewsCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50">
        <Star className="w-5 h-5 text-white fill-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{t('reviewsTitle')}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        {t('reviewsDesc')}
      </p>

      {/* Mini mockup: Reviews */}
      <div className="bg-gray-50 rounded-xl p-4 mt-auto space-y-2">
        {[
          { name: 'Camille L.', text: 'Super salon, je recommande !' },
          { name: 'Inès M.', text: 'Résultat parfait, au top.' },
        ].map((r, i) => (
          <div key={i} className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-gray-700">{r.name}</span>
              <div className="flex gap-0.5 ml-auto">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-gray-500">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card: Parrainage ── */
function ReferralCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/30 p-6 flex flex-col h-full">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200/50">
        <Share2 className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{t('referralTitle')}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        {t('referralDesc')}
      </p>

      {/* Mini mockup: Referral */}
      <div className="bg-white/80 rounded-xl p-4 mt-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="text-[10px] font-bold text-violet-700">Marie</span>
            <span className="text-[9px] font-bold text-violet-500 bg-violet-50 rounded-full px-2 py-0.5">-20%</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Share2 className="w-3 h-3 text-gray-300" />
            <div className="w-8 border-t border-dashed border-gray-200" />
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-[10px] font-bold text-pink-700">Sophie</span>
            <span className="text-[9px] font-bold text-pink-500 bg-pink-50 rounded-full px-2 py-0.5">-20%</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3 bg-emerald-50 rounded-lg px-3 py-1.5">
          <Gift className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-700">{t('referralBothRewarded')}</span>
        </div>
      </div>
    </div>
  );
}

export function LoyaltyModesSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('loyaltyModes');

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div ref={ref} className="px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12 max-w-5xl mx-auto"
        >
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4">
            {t('badge')}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Four cards grid */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          >
            <SeoCard t={t} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            <WelcomeOfferCard t={t} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          >
            <ReviewsCard t={t} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
          >
            <ReferralCard t={t} />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          className="text-center mt-10"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('page_pro_cta', 'page_pro_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            {t('cta')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
