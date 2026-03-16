'use client';

import { Gift, Trophy, Loader2, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import type { Merchant, LoyaltyCard, CagnotteData } from '@/types';

interface ScanRewardScreenProps {
  merchant: Merchant;
  loyaltyCard: LoyaltyCard;
  rewardTier: number | null;
  submitting: boolean;
  primaryColor: string;
  onRedeem: () => void;
  onSkip: () => void;
  cagnotteData?: CagnotteData | null;
}

export default function ScanRewardScreen({
  merchant,
  loyaltyCard,
  rewardTier,
  submitting,
  primaryColor,
  onRedeem,
  onSkip,
  cagnotteData,
}: ScanRewardScreenProps) {
  const t = useTranslations('scanReward');
  const locale = useLocale();
  const isCagnotte = !!cagnotteData;
  const isTier2 = rewardTier === 2;
  const gradient = isTier2
    ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
    : 'linear-gradient(135deg, #10b981, #059669)';
  const glowColor = isTier2 ? '#8b5cf620' : '#10b98120';
  const shadow = isTier2
    ? '0 8px 24px -4px rgba(139,92,246,0.4)'
    : '0 8px 24px -4px rgba(16,185,129,0.4)';
  const TierIcon = isCagnotte ? Coins : (isTier2 ? Trophy : Gift);
  const rewardLabel = isCagnotte
    ? (isTier2
      ? t('tier2Cagnotte')
      : merchant.tier2_enabled
        ? t('tier1Cagnotte')
        : t('cagnotte'))
    : (isTier2
      ? t('tier2Reward')
      : merchant.tier2_enabled
        ? t('tier1Reward')
        : t('reward'));
  const rewardText = isCagnotte && cagnotteData.rewardValue
    ? t('cagnotteAmount', { amount: formatCurrency(cagnotteData.rewardValue, merchant.country, locale) })
    : isTier2 ? merchant.tier2_reward_description : merchant.reward_description;
  const stampsRequired = isTier2 ? merchant.tier2_stamps_required : merchant.stamps_required;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">
      {/* Animated icon with glow */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      >
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{ backgroundColor: glowColor }}
          animate={{ scale: [1, 1.4, 1.2], opacity: [0.8, 0.3, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl"
          style={{ background: gradient }}
        >
          <TierIcon className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.h2
        className="text-3xl font-black text-gray-900 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {'🎉 '}{t('congratulations')}
      </motion.h2>
      <motion.p
        className="text-gray-500 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {t('visitsReached', { count: Number(stampsRequired || 0) })}
      </motion.p>

      {/* Reward Card with shine effect */}
      <motion.div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 w-full max-w-sm overflow-hidden relative"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{ background: 'linear-gradient(105deg, transparent 40%, white 50%, transparent 60%)' }}
          initial={{ x: '-150%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
        />

        <div className="relative">
          <motion.div
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: `${primaryColor}08`, border: `2px solid ${primaryColor}20` }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {rewardLabel}
            </p>
            <p className="text-2xl font-black" style={{ color: primaryColor }}>
              {rewardText}
            </p>
          </motion.div>

          <button
            onClick={onRedeem}
            disabled={submitting}
            className="w-full h-16 rounded-2xl text-lg font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: gradient, boxShadow: shadow }}
          >
            {submitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <TierIcon className="w-6 h-6" />
                {isCagnotte ? t('redeemCagnotte') : t('redeemReward')}
              </>
            )}
          </button>

          <p className="mt-4 text-sm text-gray-400">
            {isCagnotte ? t('showScreenCagnotte') : t('showScreenMerchant')}
          </p>
        </div>
      </motion.div>

      <motion.button
        onClick={onSkip}
        className="mt-6 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {t('later')}
      </motion.button>
    </div>
  );
}
