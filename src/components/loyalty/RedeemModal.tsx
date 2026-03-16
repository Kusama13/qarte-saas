'use client';

import { Check, Gift, Trophy, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 1 | 2;
  tier2Enabled: boolean | number | null;
  rewardDescription: string;
  tier2Reward: string;
  success: boolean;
  redeeming: boolean;
  merchantColor: string;
  secondaryColor?: string;
  shopName: string;
  onRedeem: (tier: 1 | 2) => void;
  onDone: () => void;
  isCagnotte?: boolean;
  cashbackAmount?: number;
  country?: string;
}

export default function RedeemModal({
  isOpen,
  onClose,
  tier,
  tier2Enabled,
  rewardDescription,
  tier2Reward,
  success,
  redeeming,
  merchantColor,
  secondaryColor,
  shopName,
  onRedeem,
  onDone,
  isCagnotte,
  cashbackAmount,
  country,
}: RedeemModalProps) {
  const t = useTranslations('redeemModal');
  const TierIcon = isCagnotte ? Coins : (tier === 2 ? Trophy : Gift);
  const gradient = isCagnotte
    ? (tier === 2
      ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
      : `linear-gradient(135deg, #10b981, #059669)`)
    : (tier === 2
      ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
      : `linear-gradient(135deg, ${merchantColor}, ${secondaryColor || merchantColor})`);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => !success && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: gradient }}
          >
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: ['-150%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            />
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

            <div className="relative z-10 px-8 pt-10 pb-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1.15, 1] }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  {success ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                  ) : (
                    <TierIcon className="w-10 h-10 text-white" />
                  )}
                </div>
              </motion.div>

              {/* Tier label */}
              {tier2Enabled && (
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                  {t('tierLabel', { tier })}
                </p>
              )}

              {/* Cashback amount for cagnotte */}
              {isCagnotte && !success && cashbackAmount != null && (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-black text-white mb-2"
                >
                  {formatCurrency(cashbackAmount, country)}
                </motion.p>
              )}

              {/* Main text */}
              <h3 className="text-2xl font-black text-white leading-tight mb-2">
                {success
                  ? (isCagnotte ? t('cashbackValidated') : t('thankYouLoyalty'))
                  : isCagnotte
                    ? t('cashbackReady')
                    : (tier === 2 ? tier2Reward : rewardDescription)
                }
              </h3>

              <p className="text-white/70 text-sm font-medium leading-relaxed mb-8">
                {success
                  ? (isCagnotte
                      ? (tier === 1 && tier2Enabled
                          ? t('resetContinue')
                          : t('resetThankYou'))
                      : (tier === 1 && tier2Enabled
                          ? t('pointsPreserved')
                          : t('thankYouSeeYou')))
                  : isCagnotte
                    ? t('onAccumulatedSpending', { reward: tier === 2 ? tier2Reward : rewardDescription })
                    : t('presentCoupon', { shopName })
                }
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => success ? onDone() : onRedeem(tier)}
                  disabled={redeeming}
                  className="w-full h-14 rounded-2xl text-base font-bold shadow-lg transition-all disabled:opacity-60"
                  style={{
                    backgroundColor: 'white',
                    color: isCagnotte ? (tier === 2 ? '#7C3AED' : '#059669') : (tier === 2 ? '#7C3AED' : merchantColor),
                  }}
                >
                  {redeeming ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      {t('validating')}
                    </span>
                  ) : success ? t('close') : (isCagnotte ? t('redeemCashback') : t('redeemNow'))}
                </motion.button>

                {!success && (
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
                  >
                    {t('later')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
