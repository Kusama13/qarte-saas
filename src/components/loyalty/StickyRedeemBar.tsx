'use client';

import { Gift, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';

interface StickyRedeemBarProps {
  visible: boolean;
  isRewardReady: boolean;
  effectiveTier1Redeemed: boolean;
  isTier2Ready: boolean;
  tier2Enabled: boolean | number | null;
  merchantColor: string;
  secondaryColor?: string;
  onRedeemTier1: () => void;
  onRedeemTier2: () => void;
}

export default function StickyRedeemBar({
  visible,
  isRewardReady,
  effectiveTier1Redeemed,
  isTier2Ready,
  tier2Enabled,
  merchantColor,
  secondaryColor,
  onRedeemTier1,
  onRedeemTier2,
}: StickyRedeemBarProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-4 py-3 space-y-2 safe-bottom"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {isRewardReady && !effectiveTier1Redeemed && (
        <Button
          onClick={onRedeemTier1}
          className="w-full h-12 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          style={{
            background: `linear-gradient(135deg, ${merchantColor}, ${secondaryColor || merchantColor})`
          }}
        >
          <Gift className="w-4 h-4 mr-2" />
          Profiter de ma récompense
        </Button>
      )}
      {tier2Enabled && isTier2Ready && (
        <Button
          onClick={onRedeemTier2}
          className="w-full h-12 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
          }}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Profiter de ma récompense palier 2
        </Button>
      )}
    </motion.div>
  );
}
