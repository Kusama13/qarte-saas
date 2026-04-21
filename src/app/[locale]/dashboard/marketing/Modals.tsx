'use client';

import {
  X,
  AlertTriangle,
  Gift,
  HelpCircle,
  EyeOff,
  Send,
  MessageSquareText,
  Zap,
  ShoppingCart,
  Clock,
  ShieldCheck,
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-sm border border-slate-100 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header sticky */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                {t('howItWorksTitle')}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 text-sm text-gray-700">
              <p className="text-gray-600">{t('intro')}</p>

              {/* Push */}
              <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">{t('pushTitle')}</h3>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{t('pushDesc')}</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• {t('pushBullet1')}</li>
                  <li>• {t('pushBullet2')}</li>
                  <li>• {t('pushBullet3')}</li>
                </ul>
              </section>

              {/* SMS marketing */}
              <section className="rounded-xl border border-[#4b0082]/20 bg-[#4b0082]/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText className="w-4 h-4 text-[#4b0082]" />
                  <h3 className="text-sm font-bold text-[#4b0082]">{t('smsTitle')}</h3>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{t('smsDesc')}</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• {t('smsBullet1')}</li>
                  <li>• {t('smsBullet2')}</li>
                  <li className="flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t('smsBullet3')}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{t('smsBullet4')}</span>
                  </li>
                </ul>
              </section>

              {/* Automatisations */}
              <section className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-sky-900">{t('autoTitle')}</h3>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{t('autoDesc')}</p>
                <div className="space-y-2 text-xs">
                  <div className="rounded-lg bg-white border border-sky-100 p-2.5">
                    <p className="font-semibold text-sky-900 text-[11px] uppercase tracking-wide mb-1">{t('autoTransactionalLabel')}</p>
                    <p className="text-gray-600">{t('autoTransactionalList')}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-[#4b0082]/20 p-2.5">
                    <p className="font-semibold text-[#4b0082] text-[11px] uppercase tracking-wide mb-1">{t('autoMarketingLabel')}</p>
                    <p className="text-gray-600">{t('autoMarketingList')}</p>
                  </div>
                </div>
              </section>

              {/* Pack & quota */}
              <section className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-900">{t('quotaTitle')}</h3>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{t('quotaDesc')}</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• <strong>{t('quotaStep1Bold')}</strong> — {t('quotaStep1Desc')}</li>
                  <li>• <strong>{t('quotaStep2Bold')}</strong> — {t('quotaStep2Desc')}</li>
                  <li>• <strong>{t('quotaStep3Bold')}</strong> — {t('quotaStep3Desc')}</li>
                </ul>
              </section>

              {/* Important */}
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-red-700 text-xs uppercase tracking-wide">{t('important')}</span>
                </div>
                <p className="text-red-700 text-xs leading-relaxed">{t('frequencyWarning')}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] touch-manipulation transition-all"
              >
                {t('understood')}
              </button>
            </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-sm border border-slate-100 max-h-[80vh] overflow-y-auto"
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
