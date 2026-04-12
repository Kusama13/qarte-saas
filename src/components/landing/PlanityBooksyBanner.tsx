'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

export default function PlanityBooksyBanner() {
  const { ref, isInView } = useInView();
  const t = useTranslations('planityBanner');

  return (
    <section className="py-8 md:py-12 bg-white">
      <div ref={ref} className={`max-w-4xl mx-auto px-6 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className="relative bg-gradient-to-r from-indigo-50 via-violet-50 to-pink-50 border border-indigo-100/60 rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-2xl">📅</span>
            <span className="text-lg font-bold text-gray-400">+</span>
            <span className="text-2xl">❤️</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-base md:text-lg font-semibold text-gray-900 mb-1">
              {t('title')}
            </p>
            <p className="text-sm md:text-base text-gray-600">
              {t('desc')}
            </p>
          </div>
          <Link
            href="/compare/planity"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
          >
            {t('cta')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
