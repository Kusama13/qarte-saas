'use client';

import { Gift, Trophy, ChevronRight, Coins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { formatEUR } from '@/lib/utils';

interface RewardCardProps {
  ready: boolean;
  showingTier2: boolean;
  tierLabel: string;
  description: string;
  remaining: number;
  merchantColor: string;
  secondaryColor?: string;
  isCagnotte?: boolean;
  cashbackAmount?: number;
  cashbackPercent?: number;
  onRedeem?: () => void;
}

function getTierGradient(showingTier2: boolean, primary: string, secondary?: string): string {
  if (showingTier2) return 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
  return `linear-gradient(135deg, ${primary}, ${secondary || primary})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatRewardText = (reward: string, remaining: number, t: (key: string, params?: any) => string) => {
  const lowerReward = reward.toLowerCase();
  const unit = remaining === 1 ? t('passageSingular') : t('passagePlural');

  const percentMatch = reward.match(/(\d+)\s*%/);
  if (percentMatch) {
    return t('onlyLeftUnit', { count: remaining, unit, text: t('percentDiscount', { percent: percentMatch[1] }) });
  }

  const euroMatch = reward.match(/(\d+)\s*€/);
  if (euroMatch) {
    return t('onlyLeftUnit', { count: remaining, unit, text: t('euroDiscount', { amount: euroMatch[1] }) });
  }

  if (lowerReward.includes('gratuit') || lowerReward.includes('offert') || lowerReward.includes('free')) {
    return t('onlyLeftUnit', { count: remaining, unit, text: lowerReward });
  }

  if (lowerReward.includes('café') || lowerReward.includes('boisson') || lowerReward.includes('thé')) {
    return t('onlyLeftUnit', { count: remaining, unit, text: lowerReward });
  }

  return t('onlyLeftUnit', { count: remaining, unit, text: reward });
};



export default function RewardCard({
  ready,
  showingTier2,
  tierLabel,
  description,
  remaining,
  merchantColor,
  secondaryColor,
  isCagnotte,
  cashbackAmount,
  cashbackPercent,
  onRedeem,
}: RewardCardProps) {
  const t = useTranslations('rewardCard');
  const TierIcon = isCagnotte ? Coins : showingTier2 ? Trophy : Gift;
  const gradient = getTierGradient(showingTier2, merchantColor, secondaryColor);

  /* ═══ CAGNOTTE MODE — READY ═══ */
  if (isCagnotte && ready) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mb-4 rounded-2xl overflow-hidden shadow-lg shadow-black/5"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onRedeem}
          className="relative w-full p-5 overflow-hidden text-left"
          style={{ background: gradient }}
        >
          <motion.div
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0"
            >
              <Coins className="w-7 h-7 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                {tierLabel ? t('tierUnlocked', { tier: tierLabel }) : t('cagnotteUnlocked')}
              </p>
              <p className="text-white text-2xl font-black leading-snug">
                {formatEUR(cashbackAmount || 0)} €
              </p>
              <p className="text-white/80 text-xs font-semibold mt-0.5">
                {t('onYourCagnotte', { percent: cashbackPercent || 0 })}
              </p>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                {t('claimCagnotte')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
          </div>
        </motion.button>
      </motion.div>
    );
  }

  /* ═══ CAGNOTTE MODE — NOT READY ═══ */
  if (isCagnotte && !ready) {
    const unit = remaining === 1 ? t('passageSingular') : t('passagePlural');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mb-4 rounded-2xl overflow-hidden bg-white border border-gray-100/80 shadow-lg shadow-gray-200/50"
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: gradient }}
            >
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                {tierLabel ? t('cagnotteLabel', { tier: tierLabel }) : t('cagnotteSimple')}
              </p>
              <p className="text-sm font-bold text-gray-800 line-clamp-2">
                {description}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(cashbackAmount || 0) > 0
                  ? t('alreadyCumulated', { amount: formatEUR(cashbackAmount || 0), remaining, unit })
                  : t('unlockCagnotte', { remaining, unit })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ═══ PASSAGE MODE (original) ═══ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={`mb-4 rounded-2xl overflow-hidden ${
        ready ? 'shadow-lg shadow-black/5' : 'bg-white border border-gray-100/80 shadow-lg shadow-gray-200/50'
      }`}
    >
      {ready ? (
        /* ═══ REWARD READY — celebration mode (clickable) ═══ */
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onRedeem}
          className="relative w-full p-5 overflow-hidden text-left"
          style={{ background: gradient }}
        >
          {/* Shimmer sweep */}
          <motion.div
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0"
            >
              <TierIcon className="w-7 h-7 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                {tierLabel ? t('tierUnlocked', { tier: tierLabel }) : t('rewardUnlocked')}
              </p>
              <p className="text-white text-base font-black leading-snug line-clamp-2">
                {description}
              </p>
              <p className="text-white/80 text-xs font-semibold mt-1">
                {t('claimNow')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
          </div>
        </motion.button>
      ) : (
        /* ═══ NOT READY — motivational preview ═══ */
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: gradient }}
            >
              <TierIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                {tierLabel ? t('rewardLabel', { tier: tierLabel }) : t('rewardSimple')}
              </p>
              <p className="text-sm font-bold text-gray-800 line-clamp-2">
                {description}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatRewardText(description, remaining, t)}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
