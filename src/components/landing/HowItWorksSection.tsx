'use client';

import { motion } from 'framer-motion';
import { QrCode, Heart, Gift, Bell } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';

/* ═══════════════════════════════════════════
   Card 1 — Créez votre programme
   ═══════════════════════════════════════════ */

function SetupCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-white rounded-xl border border-violet-100/80 shadow-lg shadow-violet-100/30 p-5 w-full h-full">
      {/* Numbered badge */}
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center shadow-sm shadow-violet-500/30">
        <span className="text-xs font-bold text-white">1</span>
      </div>

      {/* Title */}
      <p className="text-lg font-bold text-gray-900 leading-snug">{t('step1Title')}</p>
      <p className="text-base text-gray-400 mt-1 mb-4">{t('step1Desc')}</p>

      {/* Mini mockup: stamp config */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('step1Loyalty')}</span>
          <span className="text-[10px] font-extrabold text-violet-500">0/10</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[...Array(10)].map((_, i) => {
            const isLast = i === 9;
            return (
            <div key={i} className={`aspect-square rounded-lg flex items-center justify-center ${
              i < 3
                ? 'bg-gradient-to-br from-violet-400 to-indigo-500 shadow-sm shadow-violet-300/50'
                : isLast
                  ? 'bg-white border-2 border-dashed border-violet-200'
                  : 'bg-white border-2 border-dashed border-gray-200'
            }`}>
              {i < 3 ? (
                <Heart className="w-2.5 h-2.5 text-white fill-white" />
              ) : isLast ? (
                <Gift className="w-2.5 h-2.5 text-violet-300" />
              ) : (
                <span className="text-[8px] font-bold text-gray-300">{i + 1}</span>
              )}
            </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 bg-violet-50 rounded-lg px-2.5 py-1.5">
          <Gift className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
          <span className="text-[10px] font-bold text-violet-700">{t('step1Reward')}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Card 2 — Votre client scanne
   ═══════════════════════════════════════════ */

function ScanCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-white rounded-xl border border-indigo-100/80 shadow-lg shadow-indigo-100/30 p-5 w-full h-full">
      {/* Numbered badge */}
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm shadow-indigo-500/30">
        <span className="text-xs font-bold text-white">2</span>
      </div>

      {/* Tag */}
      <div className="flex items-center gap-2 mb-3 ml-2">
        <QrCode className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{t('step2Tag')}</span>
      </div>

      {/* Title */}
      <p className="text-lg font-bold text-gray-900 leading-snug">{t('step2Title')}</p>
      <p className="text-base text-gray-400 mt-1 mb-4">{t('step2Desc')}</p>

      {/* Mini mockup: QR code + toast */}
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
        {/* QR Code SVG */}
        <div className="relative w-20 h-20 bg-white rounded-xl border-2 border-indigo-200 p-2 mb-2">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Simplified QR pattern */}
            <rect x="5" y="5" width="25" height="25" rx="3" fill="#4f46e5" />
            <rect x="70" y="5" width="25" height="25" rx="3" fill="#4f46e5" />
            <rect x="5" y="70" width="25" height="25" rx="3" fill="#4f46e5" />
            <rect x="10" y="10" width="15" height="15" rx="2" fill="white" />
            <rect x="75" y="10" width="15" height="15" rx="2" fill="white" />
            <rect x="10" y="75" width="15" height="15" rx="2" fill="white" />
            <rect x="14" y="14" width="7" height="7" rx="1" fill="#4f46e5" />
            <rect x="79" y="14" width="7" height="7" rx="1" fill="#4f46e5" />
            <rect x="14" y="79" width="7" height="7" rx="1" fill="#4f46e5" />
            {/* Data dots */}
            <rect x="38" y="5" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="52" y="5" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="38" y="18" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="5" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="18" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="38" y="38" width="8" height="8" rx="1.5" fill="#6366f1" />
            <rect x="52" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="70" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="85" y="38" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="38" y="52" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="52" y="52" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="70" y="52" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="38" y="70" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="52" y="70" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="70" y="70" width="8" height="8" rx="1.5" fill="#6366f1" />
            <rect x="85" y="70" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="70" y="85" width="8" height="8" rx="1.5" fill="#4f46e5" />
            <rect x="85" y="85" width="8" height="8" rx="1.5" fill="#4f46e5" />
          </svg>
          {/* Scan line animation */}
          <div className="absolute inset-x-2 top-2 h-0.5 bg-indigo-400/60 rounded-full animate-pulse" />
        </div>

        {/* Toast "Point ajouté" */}
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-md shadow-emerald-100/50 border border-emerald-100">
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-gray-800">{t('step2Toast')}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Card 3 — Il revient tout seul
   ═══════════════════════════════════════════ */

function RewardCard({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200/60 shadow-lg shadow-rose-100/30 p-5 w-full h-full">
      {/* Numbered badge */}
      <div className="absolute -top-3 -left-3 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-sm shadow-rose-500/30">
        <span className="text-xs font-bold text-white">3</span>
      </div>

      {/* Tag */}
      <div className="flex items-center gap-2 mb-3 ml-2">
        <Bell className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-bold text-rose-400 uppercase tracking-wider">{t('step3Tag')}</span>
      </div>

      {/* Title */}
      <p className="text-lg font-bold text-gray-900 leading-snug">{t('step3Title')}</p>
      <p className="text-base text-gray-400 mt-1 mb-4">{t('step3Desc')}</p>

      {/* Mini mockup: filled card + reward */}
      <div className="bg-white/80 rounded-lg p-3 space-y-2">
        {/* Filled stamps */}
        <div className="grid grid-cols-5 gap-1.5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg flex items-center justify-center bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm shadow-rose-300/50">
              {i === 9 ? (
                <Gift className="w-2.5 h-2.5 text-white" />
              ) : (
                <Heart className="w-2.5 h-2.5 text-white fill-white" />
              )}
            </div>
          ))}
        </div>

        {/* Reward unlocked */}
        <div className="relative bg-gradient-to-r from-rose-100 to-pink-100 border-2 border-rose-300/60 rounded-xl p-2.5 overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center shadow-md shadow-rose-400/40">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-gray-900">{t('step3Reward')}</p>
              <p className="text-[9px] font-bold text-rose-600">{t('step3Unlocked')}</p>
            </div>
            <span className="text-lg ml-auto">🎉</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Section
   ═══════════════════════════════════════════ */

export function HowItWorksSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('howItWorks');

  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
            </span>
          </h2>
        </div>

        {/* 3 Steps */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-5 max-w-4xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-full"
          >
            <SetupCard t={t} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="h-full"
          >
            <ScanCard t={t} />
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


      </div>
    </section>
  );
}
