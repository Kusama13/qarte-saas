'use client';

import { useState } from 'react';
import { Users, X, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { getScanUrl } from '@/lib/utils';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  scanCode: string;
  shopName: string;
  merchantId: string;
  rewardReferrer: string | null;
  rewardReferred: string | null;
}

const REFERRAL_COOLDOWN_DAYS = 90;

export default function ReferralModal({
  isOpen, onClose, referralCode, scanCode, shopName, merchantId,
  rewardReferrer, rewardReferred,
}: ReferralModalProps) {
  const t = useTranslations('referralModal');
  const [copied, setCopied] = useState(false);

  const shareUrl = `${getScanUrl(scanCode)}?ref=${referralCode}`;

  // Check cooldown synchronously to avoid modal flash
  const cooldownKey = `qarte_referral_shown_${merchantId}`;
  const stored = typeof window !== 'undefined' ? localStorage.getItem(cooldownKey) : null;
  const withinCooldown = stored ? (Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24) < REFERRAL_COOLDOWN_DAYS : false;

  const handleShare = async () => {
    localStorage.setItem(cooldownKey, Date.now().toString());
    if (navigator.share) {
      try {
        await navigator.share({
          title: shopName,
          text: t('shareText', { shopName, link: shareUrl }),
          url: shareUrl,
        });
      } catch { /* user cancelled */ }
      onClose();
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => { setCopied(false); onClose(); }, 1500);
      } catch {
        onClose();
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(`qarte_referral_shown_${merchantId}`, Date.now().toString());
    onClose();
  };

  if (withinCooldown) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mb-2 sm:mb-0 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Fond violet subtil */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-50 to-transparent pointer-events-none" />

            {/* Bouton fermer */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative px-8 pt-10 pb-8 text-center">
              {/* Icone parrainage */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200/60 mb-6"
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>

              {/* Titre */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[1.35rem] font-black text-gray-900 leading-snug mb-2"
              >
                {t('title')}
              </motion.p>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-500 mb-6"
              >
                {t('subtitle')}
              </motion.p>

              {/* Bloc recompenses */}
              {(rewardReferrer || rewardReferred) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2 mb-6"
                >
                  {rewardReferrer && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-violet-50 border border-violet-100">
                      <span className="text-xs font-bold text-violet-500 uppercase tracking-wider shrink-0">{t('youGet')}</span>
                      <span className="text-sm font-semibold text-gray-900 text-left">{rewardReferrer}</span>
                    </div>
                  )}
                  {rewardReferred && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider shrink-0">{t('theyGet')}</span>
                      <span className="text-sm font-semibold text-gray-900 text-left">{rewardReferred}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Boutons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <button
                  onClick={handleShare}
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white text-base font-bold shadow-lg shadow-violet-200/60 hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.97] transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      {t('share')}
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t('noThanks')}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
