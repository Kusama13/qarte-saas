'use client';

import { Gift, Trophy, Zap, Heart, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

/** Grid columns: min 5 for consistent size, smart layout for 6+ to avoid orphans */
function getGridCols(total: number): string {
  if (total <= 5) return 'grid-cols-5';
  if (total === 6) return 'grid-cols-3';
  if (total === 7) return 'grid-cols-4';
  if (total === 8) return 'grid-cols-4';
  if (total === 9) return 'grid-cols-5';
  if (total === 10) return 'grid-cols-5';
  if (total === 11) return 'grid-cols-4';
  if (total === 12) return 'grid-cols-4';
  if (total === 13) return 'grid-cols-5';
  if (total === 14) return 'grid-cols-5';
  if (total === 15) return 'grid-cols-5';
  return 'grid-cols-5';
}

interface CagnotteSectionProps {
  currentStamps: number;
  tier1Required: number;
  tier2Enabled: boolean | number | null;
  tier2Required: number;
  isRewardReady: boolean;
  isTier2Ready: boolean;
  effectiveTier1Redeemed: boolean;
  merchantColor: string;
  secondaryColor?: string | null;
  rewardDescription: string;
  tier2RewardDescription: string;
  completedCycles?: number;
}

function getDualStampClass(isEarned: boolean, isGreyed: boolean, isLast: boolean): string {
  if (isEarned && !isGreyed) return 'text-white shadow-md';
  if (isEarned && isGreyed) return 'bg-gray-200 text-gray-500';
  if (isLast) return 'bg-gray-50 border-2 border-dashed text-gray-300';
  return 'bg-gray-50 text-gray-300 border border-gray-100';
}

function getSingleStampClass(isEarned: boolean, isLast: boolean, isNext: boolean): string {
  if (isEarned) return 'text-white shadow-lg';
  if (isLast) return 'bg-white border-2 border-dashed text-gray-300';
  if (isNext) return 'bg-white border-2 border-dashed shadow-sm';
  return 'bg-gray-50 text-gray-200 border border-gray-100';
}

function getTier1StatusBadge(
  effectiveTier1Redeemed: boolean,
  isRewardReady: boolean,
  remaining: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: any) => string,
) {
  if (effectiveTier1Redeemed) {
    return <span className="px-2.5 py-1 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 uppercase">{t('claimed')}</span>;
  }
  if (isRewardReady) {
    return (
      <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-2.5 py-1 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase shadow-lg shadow-amber-200">
        {t('ready')}
      </motion.span>
    );
  }
  if (remaining <= 2) {
    return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-[10px] font-black text-amber-700 border border-amber-200">{t('onlyLeft', { count: remaining })}</span>;
  }
  return <span className="text-[10px] font-bold text-gray-500">{t('remaining', { count: remaining })}</span>;
}

export default function CagnotteSection({
  currentStamps,
  tier1Required,
  tier2Enabled,
  tier2Required,
  isRewardReady,
  isTier2Ready,
  effectiveTier1Redeemed,
  merchantColor,
  secondaryColor,
  rewardDescription,
  tier2RewardDescription,
  completedCycles = 0,
}: CagnotteSectionProps) {
  const t = useTranslations('cagnotteSection');
  const tier2Color = secondaryColor || merchantColor;
  const cycleBadge = completedCycles > 0 ? (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
      completedCycles >= 4 ? 'bg-amber-50 border-amber-200 text-amber-700'
        : completedCycles >= 2 ? 'bg-violet-50 border-violet-200 text-violet-600'
        : 'bg-pink-50 border-pink-200 text-pink-600'
    }`}>
      <Crown className="w-3 h-3" />
      {t('cycleCount', { n: completedCycles + 1 })}
    </span>
  ) : null;
  if (tier2Enabled) {
    return (
      <div className="space-y-5">
        {completedCycles > 0 && (
          <div className="flex justify-end">{cycleBadge}</div>
        )}
        {/* PALIER 1 */}
        <div className={`p-4 rounded-xl border transition-all ${
          isRewardReady && !effectiveTier1Redeemed
            ? 'border-amber-200 bg-amber-50/30'
            : effectiveTier1Redeemed
              ? 'border-gray-100 bg-gray-50/50 opacity-60'
              : 'border-gray-100'
        }`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Gift className={`w-4 h-4 ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-500' : 'text-gray-500'}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-600' : 'text-gray-500'}`}>
                {t('tier1')}
              </span>
            </div>
            {getTier1StatusBadge(effectiveTier1Redeemed, isRewardReady, tier1Required - currentStamps, t)}
          </div>

          <div className={`grid ${getGridCols(tier1Required)} gap-2.5 mb-3`}>
            {Array.from({ length: tier1Required }).map((_, i) => {
              const isEarned = i < currentStamps;
              const isGreyed = effectiveTier1Redeemed;
              const isLast = i === tier1Required - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${getDualStampClass(isEarned, isGreyed, isLast)}`}
                  style={{
                    backgroundColor: isEarned && !isGreyed ? merchantColor : undefined,
                    borderColor: isLast && !isEarned ? `${merchantColor}40` : undefined,
                  }}
                >
                  {isLast && !isEarned ? (
                    <Gift className="w-5 h-5" style={{ color: `${merchantColor}60` }} />
                  ) : (
                    <Heart className="w-5 h-5" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className={`text-center text-sm font-medium italic ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-800' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {rewardDescription || t('defaultReward')}
          </p>
        </div>

        {/* PALIER 2 */}
        <div className={`p-4 rounded-xl border transition-all ${
          isTier2Ready
            ? 'border-violet-200 bg-violet-50/30'
            : currentStamps >= tier1Required
              ? 'border-violet-100'
              : 'border-gray-100 opacity-50'
        }`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: isTier2Ready ? tier2Color : '#9ca3af' }} />
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: isTier2Ready ? tier2Color : '#9ca3af' }}>{t('tier2')}</span>
            </div>
            {isTier2Ready ? (
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-2.5 py-1 rounded-full text-[10px] font-black text-white uppercase shadow-lg"
                style={{ backgroundColor: tier2Color, boxShadow: `0 4px 14px ${tier2Color}30` }}
              >{t('unlocked')}</motion.span>
            ) : tier2Required - currentStamps <= 2 ? (
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-black border"
                style={{ backgroundColor: `${tier2Color}15`, color: tier2Color, borderColor: `${tier2Color}30` }}
              >{t('onlyLeft', { count: tier2Required - currentStamps })}</span>
            ) : (
              <span className="text-[10px] font-bold text-gray-500">{t('remaining', { count: tier2Required - currentStamps })}</span>
            )}
          </div>

          <div className={`grid ${getGridCols(tier2Required - tier1Required)} gap-2.5 mb-3`}>
            {Array.from({ length: tier2Required - tier1Required }).map((_, i) => {
              const isEarned = currentStamps >= (tier1Required + i + 1);
              const isLast = i === (tier2Required - tier1Required - 1);
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isEarned ? 'text-white shadow-md' : isLast ? 'bg-gray-50 border-2 border-dashed' : 'bg-gray-50 text-gray-300 border border-gray-100'
                  }`}
                  style={
                    isEarned
                      ? { backgroundColor: tier2Color }
                      : isLast
                        ? { borderColor: `${tier2Color}30`, color: `${tier2Color}60` }
                        : undefined
                  }
                >
                  {isLast && !isEarned ? <Trophy className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                </motion.div>
              );
            })}
          </div>

          <p className={`text-center text-sm font-medium italic ${isTier2Ready ? 'text-violet-800' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {tier2RewardDescription || t('defaultTier2Reward')}
          </p>
        </div>
      </div>
    );
  }

  /* ═══════════════ SINGLE TIER ═══════════════ */
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{t('myLoyalty')}</span>
          {cycleBadge}
        </div>
        {isRewardReady ? (
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <Gift className="w-5 h-5" />
            <span className="text-xs font-black uppercase">{t('ready')}</span>
          </motion.div>
        ) : tier1Required - currentStamps <= 2 ? (
          <motion.div animate={{ x: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 1.5 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-black">{t('onlyLeft', { count: tier1Required - currentStamps })}</span>
          </motion.div>
        ) : null}
      </div>

      <div className={`grid ${getGridCols(tier1Required)} gap-3`}>
        {Array.from({ length: tier1Required }).map((_, i) => {
          const isEarned = i < currentStamps;
          const isLast = i === tier1Required - 1;
          const isNext = !isEarned && i === currentStamps && !isLast;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${getSingleStampClass(isEarned, isLast, isNext)}`}
              style={{
                backgroundColor: isEarned ? merchantColor : undefined,
                borderColor: (isLast && !isEarned)
                  ? `${merchantColor}40`
                  : isNext
                    ? `${merchantColor}35`
                    : undefined,
              }}
            >
              {isLast && !isEarned ? (
                <Gift className="w-5 h-5" style={{ color: `${merchantColor}60` }} />
              ) : isNext ? (
                <Heart className="w-5 h-5" style={{ color: `${merchantColor}30` }} />
              ) : (
                <Heart className={isEarned ? 'w-6 h-6' : 'w-4 h-4'} />
              )}
            </motion.div>
          );
        })}
      </div>

      <p className={`text-center text-sm font-medium italic ${isRewardReady ? 'text-emerald-700' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        {rewardDescription || t('defaultReward')}
      </p>
    </div>
  );
}
