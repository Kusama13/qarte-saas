'use client';

import { motion } from 'framer-motion';
import { Gift, Share2, Users } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';

function ShareCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-white rounded-xl border border-violet-100/80 shadow-lg shadow-violet-100/30 p-5 w-full h-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center shadow-sm shadow-violet-500/30">
        <span className="text-xs font-bold text-white">1</span>
      </div>
      <div className="flex items-center gap-2 mb-2 ml-2">
        <Share2 className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">{t('step1Tag')}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 leading-snug">{t('step1Title')}</p>
      <p className="text-base text-gray-400 mt-1">{t('step1Desc')}</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-pink-200 border-2 border-white" />
          <div className="w-7 h-7 rounded-full bg-violet-200 border-2 border-white" />
          <div className="w-7 h-7 rounded-full bg-indigo-200 border-2 border-white" />
        </div>
        <span className="text-xs font-medium text-gray-400">{t('step1Invited')}</span>
      </div>
    </div>
  );
}

function JoinCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-white rounded-xl border border-indigo-100/80 shadow-lg shadow-indigo-100/30 p-5 w-full h-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm shadow-indigo-500/30">
        <span className="text-xs font-bold text-white">2</span>
      </div>
      <div className="flex items-center gap-2 mb-2 ml-2">
        <Users className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{t('step2Tag')}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 leading-snug">{t('step2Title')}</p>
      <p className="text-base text-gray-400 mt-1">{t('step2Desc')}</p>
      <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
        <span>✓</span> {t('step2Via')}
      </div>
    </div>
  );
}

function RewardCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200/60 shadow-lg shadow-rose-100/30 p-5 w-full h-full">
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-sm shadow-rose-500/30">
        <span className="text-xs font-bold text-white">3</span>
      </div>
      <div className="flex items-center gap-2 mb-2 ml-2">
        <Gift className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-bold text-rose-400 uppercase tracking-wider">{t('step3Tag')}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 leading-snug">{t('step3Title')}</p>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-3 h-3 text-rose-500" />
          </div>
          <span className="text-gray-600">{t('step3Reward1')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-3 h-3 text-rose-500" />
          </div>
          <span className="text-gray-600">{t('step3Reward2')}</span>
        </div>
      </div>
    </div>
  );
}

export function ReferralSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('referral');

  return (
    <section className="py-24 md:py-32 bg-gray-50 overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-100 rounded-full mb-6">
            <Users className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold text-violet-600 tracking-wide">{t('badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-5 max-w-4xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full"
          >
            <ShareCard t={t} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="h-full"
          >
            <JoinCard t={t} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="h-full"
          >
            <RewardCard t={t} />
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{t('stat1')}</p>
              <p className="text-sm text-gray-500">{t('stat1Label')}</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-200" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{t('stat2')}</p>
              <p className="text-sm text-gray-500">{t('stat2Label')}</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-gray-200" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{t('stat3')}</p>
              <p className="text-sm text-gray-500">{t('stat3Label')}</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
