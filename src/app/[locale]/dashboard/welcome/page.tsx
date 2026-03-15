'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Users, Globe, ArrowRight, Check, Star, MapPin, Link2 } from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { useTranslations } from 'next-intl';

export default function WelcomePage() {
  const router = useRouter();
  const { merchant, loading } = useMerchant();
  const t = useTranslations('welcome');

  // Auto-redirect if merchant already has a configured program (not fresh from onboarding)
  useEffect(() => {
    if (!loading && merchant && merchant.reward_description) {
      const fromOnboarding = document.referrer.includes('/personalize') || document.referrer.includes('/signup/');
      if (!fromOnboarding) {
        router.replace('/dashboard');
      }
    }
  }, [loading, merchant, router]);

  if (loading || !merchant) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{merchant.shop_name}</span>, {t('title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">{t('title2')}</span> {t('title3')}
        </h1>
        <p className="text-gray-500 mt-3 text-sm md:text-base">
          {t('subtitle')}
        </p>
      </motion.div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full mb-8">
        {/* Card 1: Programme fidélité */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          onClick={() => router.push('/dashboard/program')}
          className="group relative p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-300 shadow-sm hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 text-left overflow-hidden"
        >
          {/* Mini stamp card preview */}
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50">
            <div className="flex items-center gap-1.5 mb-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    i < 4
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm'
                      : 'border-2 border-dashed border-indigo-200'
                  }`}
                >
                  {i < 4 ? <Check className="w-3 h-3" /> : null}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-indigo-400">4/6 {t('stamps')}</span>
              <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-indigo-500" /> {t('reward')}
              </span>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-1">{t('loyaltyTitle')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('loyaltyDesc')}
          </p>
          <div className="flex items-center gap-1 mt-4 text-sm font-semibold text-indigo-600 group-hover:gap-2 transition-all">
            {t('configure')}
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* Card 2: Ma page pro */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          onClick={() => router.push('/dashboard/public-page')}
          className="group relative p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-violet-300 shadow-sm hover:shadow-lg hover:shadow-violet-100/50 transition-all duration-300 text-left overflow-hidden"
        >
          {/* Mini page pro preview */}
          <div className="relative mb-5 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{merchant.shop_name?.charAt(0) || 'Q'}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800 leading-none">{merchant.shop_name}</p>
                <p className="text-[8px] text-gray-400 flex items-center gap-0.5">
                  <MapPin className="w-2 h-2" /> {t('yourCity')}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-5 rounded-md bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center">
                <span className="text-[8px] font-semibold text-white">{t('bookAppt')}</span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 h-8 rounded bg-gray-100" />
                <div className="flex-1 h-8 rounded bg-gray-100" />
                <div className="flex-1 h-8 rounded bg-gray-100" />
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-violet-100 shadow-sm">
                <Link2 className="w-2.5 h-2.5 text-violet-500" />
                <span className="text-[8px] font-semibold text-violet-600">{t('bioLink')}</span>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-1">{t('pageTitle')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('pageDesc')}
          </p>
          <div className="flex items-center gap-1 mt-4 text-sm font-semibold text-violet-600 group-hover:gap-2 transition-all">
            {t('configure')}
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>

      {/* Skip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        onClick={() => router.push('/dashboard')}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        {t('skipForNow')}
      </motion.button>
    </div>
  );
}
