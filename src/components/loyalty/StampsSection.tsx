'use client';

import { Gift, Heart, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const LoyaltyIcon = Heart;

interface StampsSectionProps {
  currentStamps: number;
  tier1Required: number;
  tier2Enabled: boolean | number | null;
  tier2Required: number;
  isRewardReady: boolean;
  isTier2Ready: boolean;
  effectiveTier1Redeemed: boolean;
  merchantColor: string;
  secondaryColor?: string;
  rewardDescription: string;
  tier2Reward: string;
}

function getDualStampClass(isEarned: boolean, isGreyed: boolean, isLast: boolean): string {
  if (isEarned && !isGreyed) return 'text-white shadow-md';
  if (isEarned && isGreyed) return 'bg-gray-200 text-gray-400';
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
) {
  if (effectiveTier1Redeemed) {
    return <span className="px-2.5 py-1 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 uppercase">Réclamé</span>;
  }
  if (isRewardReady) {
    return (
      <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-2.5 py-1 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase shadow-lg shadow-amber-200">
        Prêt !
      </motion.span>
    );
  }
  if (remaining <= 2) {
    return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-[10px] font-black text-amber-700 border border-amber-200">Plus que {remaining} !</span>;
  }
  return <span className="text-[10px] font-bold text-gray-400">{remaining} restants</span>;
}

export default function StampsSection({
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
  tier2Reward,
}: StampsSectionProps) {
  if (tier2Enabled) {
    return (
      <div className="space-y-5">
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
              <Gift className={`w-4 h-4 ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-600' : 'text-gray-400'}`}>
                Palier 1
              </span>
            </div>
            {getTier1StatusBadge(effectiveTier1Redeemed, isRewardReady, tier1Required - currentStamps)}
          </div>

          <div className="grid grid-cols-5 gap-2.5 mb-3">
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
                    <Gift className="w-4 h-4" style={{ color: `${merchantColor}60` }} />
                  ) : (
                    <LoyaltyIcon className="w-4 h-4" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className={`text-center text-sm font-medium italic ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-800' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {rewardDescription || 'Cadeau de fidélité'}
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
              <Trophy className={`w-4 h-4 ${isTier2Ready ? 'text-violet-500' : 'text-gray-400'}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${isTier2Ready ? 'text-violet-600' : 'text-gray-400'}`}>Palier 2</span>
            </div>
            {isTier2Ready ? (
              <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="px-2.5 py-1 rounded-full bg-violet-600 text-[10px] font-black text-white uppercase shadow-lg shadow-violet-200">Débloqué !</motion.span>
            ) : tier2Required - currentStamps <= 2 ? (
              <span className="px-2.5 py-1 rounded-full bg-violet-100 text-[10px] font-black text-violet-700 border border-violet-200">Plus que {tier2Required - currentStamps} !</span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400">{tier2Required - currentStamps} restants</span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2.5 mb-3">
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
                    isEarned ? 'bg-violet-600 text-white shadow-md' : isLast ? 'bg-gray-50 border-2 border-dashed border-violet-200 text-violet-300' : 'bg-gray-50 text-gray-300 border border-gray-100'
                  }`}
                >
                  {isLast && !isEarned ? <Trophy className="w-4 h-4" /> : <LoyaltyIcon className="w-4 h-4" />}
                </motion.div>
              );
            })}
          </div>

          <p className={`text-center text-sm font-medium italic ${isTier2Ready ? 'text-violet-800' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {tier2Reward || 'Récompense Premium'}
          </p>
        </div>
      </div>
    );
  }

  /* ═══════════════ SINGLE TIER ═══════════════ */
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Ma fidélité</span>
        {isRewardReady ? (
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <Gift className="w-4 h-4" />
            <span className="text-xs font-black uppercase">Prêt !</span>
          </motion.div>
        ) : tier1Required - currentStamps <= 2 ? (
          <motion.div animate={{ x: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 1.5 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-black">Plus que {tier1Required - currentStamps} !</span>
          </motion.div>
        ) : null}
      </div>

      <div className="grid grid-cols-5 gap-3">
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
                <LoyaltyIcon className="w-5 h-5" style={{ color: `${merchantColor}30` }} />
              ) : (
                <LoyaltyIcon className={isEarned ? 'w-6 h-6' : 'w-4 h-4'} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
