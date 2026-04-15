'use client';

import { Sparkles } from 'lucide-react';
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
          className="overflow-hidden mb-6"
        >
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 leading-relaxed space-y-1">
                <p>{t('helpDesc1')}</p>
                <p>{t('helpDesc2')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
