'use client';

import { Gift, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface RewardCardProps {
  ready: boolean;
  showingTier2: boolean;
  tierLabel: string;
  description: string;
  remaining: number;
  merchantColor: string;
  secondaryColor?: string;
}

function getTierGradient(showingTier2: boolean, primary: string, secondary?: string): string {
  if (showingTier2) return 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
  return `linear-gradient(135deg, ${primary}, ${secondary || primary})`;
}

const formatRewardText = (reward: string, remaining: number) => {
  const lowerReward = reward.toLowerCase();
  const unit = remaining === 1 ? 'passage' : 'passages';

  const percentMatch = reward.match(/(\d+)\s*%/);
  if (percentMatch) {
    return `Plus que ${remaining} ${unit} pour ${percentMatch[1]}% de réduction !`;
  }

  const euroMatch = reward.match(/(\d+)\s*€/);
  if (euroMatch) {
    return `Plus que ${remaining} ${unit} pour ${euroMatch[1]}€ de réduction !`;
  }

  if (lowerReward.includes('gratuit') || lowerReward.includes('offert')) {
    return `Plus que ${remaining} ${unit} pour ${reward.toLowerCase()} !`;
  }

  if (lowerReward.includes('café') || lowerReward.includes('boisson') || lowerReward.includes('thé')) {
    return `Plus que ${remaining} ${unit} pour votre ${reward.toLowerCase()} !`;
  }

  return `Plus que ${remaining} ${unit} pour : ${reward}`;
};

export default function RewardCard({
  ready,
  showingTier2,
  tierLabel,
  description,
  remaining,
  merchantColor,
  secondaryColor,
}: RewardCardProps) {
  const TierIcon = showingTier2 ? Trophy : Gift;
  const gradient = getTierGradient(showingTier2, merchantColor, secondaryColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={`mb-4 rounded-2xl overflow-hidden ${
        ready ? 'shadow-lg' : 'bg-white border border-gray-100/80 shadow-sm'
      }`}
    >
      {ready ? (
        /* ═══ REWARD READY — celebration mode ═══ */
        <div className="relative p-5 overflow-hidden" style={{ background: gradient }}>
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
                {tierLabel ? `${tierLabel} débloqué` : 'Récompense débloquée'}
              </p>
              <p className="text-white text-base font-black leading-snug line-clamp-2">
                {description}
              </p>
              <p className="text-white/80 text-xs font-semibold mt-1">
                Réclamez-la maintenant !
              </p>
            </div>
          </div>
        </div>
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
                {tierLabel ? `Récompense · ${tierLabel}` : 'Récompense'}
              </p>
              <p className="text-sm font-bold text-gray-800 line-clamp-2">
                {description}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatRewardText(description, remaining)}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
