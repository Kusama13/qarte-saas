'use client';

import { motion } from 'framer-motion';
import { Star, Check, TrendingUp } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';

export function CaseStudySection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('caseStudy');

  return (
    <section id="case-study" className="py-14 bg-gradient-to-b from-white to-gray-50">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              {t('titleBold')}
            </span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            {/* Left: Story */}
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src="/images/testimonial-nail-salon.png"
                    alt="Nail Salon by Elodie"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Nail Salon by Elodie</h3>
                  <p className="text-gray-500 text-sm">{t('role')}</p>
                </div>
              </div>

              <blockquote className="text-lg text-gray-700 leading-relaxed mb-8 italic border-l-4 border-rose-200 pl-4">
                &quot;{t('quote')}&quot;
              </blockquote>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">{t('whatChanged')}</h4>
                {[t('change1'), t('change2'), t('change3'), t('change4')].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Results — 1 hero metric + 2 small */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-10 text-white flex flex-col justify-center">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-200 mb-8">
                {t('resultsTitle')}
              </h4>

              {/* Hero metric */}
              <div className="mb-10">
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-indigo-200">
                    +45%
                  </span>
                  <TrendingUp className="w-8 h-8 text-emerald-300" />
                </div>
                <p className="text-indigo-200 text-lg mt-2">{t('regularClients')}</p>
              </div>

              {/* 2 small metrics */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold">4.8</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="text-indigo-200 text-xs mt-1">{t('googleRating')}</p>
                </div>
                <div>
                  <span className="text-3xl font-bold">83</span>
                  <p className="text-indigo-200 text-xs mt-1">{t('loyaltyCards')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
