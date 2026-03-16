'use client';

import {
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface HowItWorksProps {
  show: boolean;
}

export default function HowItWorks({ show }: HowItWorksProps) {
  const t = useTranslations('members');
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mb-8"
        >
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{t('howItWorksTitle')}</h3>
                <p className="text-sm text-gray-600">{t('howItWorksDesc')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">1</div>
                  <span className="font-semibold text-gray-900">{t('step1Title')}</span>
                </div>
                <p className="text-sm text-gray-500">{t('step1Desc')}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">2</div>
                  <span className="font-semibold text-gray-900">{t('step2Title')}</span>
                </div>
                <p className="text-sm text-gray-500">{t('step2Desc')}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">3</div>
                  <span className="font-semibold text-gray-900">{t('step3Title')}</span>
                </div>
                <p className="text-sm text-gray-500">{t('step3Desc')}</p>
              </div>
            </div>

            <div className="mt-5 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800" dangerouslySetInnerHTML={{ __html: t('tip') }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
