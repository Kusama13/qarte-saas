'use client';

import {
  X,
  AlertTriangle,
  Gift,
  HelpCircle,
  EyeOff,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { toBCP47 } from '@/lib/utils';

interface HowItWorksModalProps {
  show: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ show, onClose }: HowItWorksModalProps) {
  const t = useTranslations('marketing.modals');
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                {t('howItWorksTitle')}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              {[
                { title: t('step1Title'), desc: t('step1Desc') },
                { title: t('step2Title'), desc: t('step2Desc') },
                { title: t('step3Title'), desc: t('step3Desc') },
                { title: t('step4Title'), desc: t('step4Desc') },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-red-700">{t('important')}</span>
                </div>
                <p className="text-red-600 text-xs">
                  {t('frequencyWarning')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {t('understood')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OfferModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imageUrl: string | null;
  expiresAt: string | null;
  onDeactivate: () => void;
}

export function OfferModal({ show, onClose, title, description, imageUrl, expiresAt, onDeactivate }: OfferModalProps) {
  const locale = useLocale();
  const t = useTranslations('marketing.modals');
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-500" />
                {t('activeOffer')}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{t('offerTitle')}</p>
                <p className="font-bold text-gray-900">{title || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{t('offerDescription')}</p>
                <p className="text-gray-700 whitespace-pre-wrap">{description || '-'}</p>
              </div>

              {imageUrl && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{t('offerImage')}</p>
                  <img src={imageUrl} alt={t('offerImage')} className="w-full h-40 object-cover rounded-xl" />
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{t('offerExpiration')}</p>
                <p className="text-gray-700">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString(toBCP47(locale), {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t('close')}
              </button>
              <button
                onClick={() => { onClose(); onDeactivate(); }}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                {t('deactivate')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
